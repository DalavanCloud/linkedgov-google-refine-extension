
/*
 * addressWizard
 * 
 * The address wizard helps to clean up addresses, with the postcode being the
 * highest priority.
 * 
 * A user is able to select one column containing a full address, in which case,
 * a regular expression is used to separate the different parts of the address
 * into separate columns, so types can be applied to those columns.
 * 
 * The user is also able to select multiple columns that contain fragments of an
 * address, in which case the relevant address fragment RDF is produced for the columns.
 * 
 * Postcode regex obtained from Wikipedia:
 * http://en.wikipedia.org/wiki/Postcodes_in_the_United_Kingdom#Validation
 * 
 */
var addressWizard = {

		/*
		 * Regex has been modified to account for a space in the middle of postcodes: 
		 * "Z]?{0" 
		 * to
		 * "Z]? {0".
		 */
		vars : {
			elmts : {},
			postCodeRegex : "[A-Z]{1,2}[0-9R][0-9A-Z]? {0,1}[0-9][ABD-HJLNP-UW-Z]{2}",
			colObjects : [],
			vocabs : {
				rdfs : {
					curie : "rdfs",
					uri : "http://www.w3.org/2000/01/rdf-schema#"
				},
				vcard : {
					curie : "vcard",
					uri : "http://www.w3.org/2006/vcard/ns#"
				},
				ospc : {
					curie : "ospc",
					uri : "http://data.ordnancesurvey.co.uk/ontology/postcode/",
					resourceURI : "http://data.ordnancesurvey.co.uk/id/postcodeunit/"
				},
				lg : {
					curie: "lg",
					uri: LinkedGov.vars.lgNameSpace
				}
			}
		},

		/*
		 * Build the column objects and commence a chain of validation and RDF saving 
		 * operations.
		 */
		initialise : function(elmts) {

			var self = this;
			self.vars.elmts = elmts;

			/*
			 * Build an array of column objects with their options
			 * 
			 * {name - column name part - the specified address part
			 * containsPostcode - boolean is user has specified the column contains
			 * a post code.}
			 */
			self.vars.colObjects = self.buildColumnObjects();

			if (self.vars.colObjects.length > 0) {

				LinkedGov.showWizardProgress(true);

				/*
				 * A marker for recursing through the columns.
				 */
				var index = 0;

				/*
				 * Perform the postcode regex match on any columns that contain postcodes
				 */
				self.validatePostCodeColumns(index, function() {
					/*
					 * Build the address fragments RDF
					 */
					self.makeAddressFragments(function() {
						/*
						 * Save the RDF
						 */
						LinkedGov.checkSchema(self.vars.vocabs, function(rootNode, foundRootNode) {
							self.saveRDF(rootNode, foundRootNode);
						});
					});
				});

			} else {
				alert("You need to specify one or more columns as having a part of an address in.")
			}
		},

		/*
		 * buildColumnObjects
		 * 
		 * Creates an array of fragment/column name objects.
		 */
		buildColumnObjects : function() {

			//log("buildColumnObjects");

			var self = this;
			var array = [];

			/*
			 * If there are columns that have been selected, loop through them and 
			 * store their names and options in an array.
			 */
			if ($(self.vars.elmts.addressColumns).children("li").length > 0) {
				$(self.vars.elmts.addressColumns).children("li").each(function() {

					var el = $(this);
					/*
					 * Skip any columns that have been removed
					 */
					if (!$(this).hasClass("skip")) {

						/*
						 * Each column object contains the column name, the type of address fragment it contains, and
						 * a boolean for whether it contains a postcode.
						 */
						array.push({
							name : el.find("span.col").html(),
							part : el.find("select").val(),
							containsPostcode : el.find("input.postcode[type='checkbox']").attr("checked")
						});

					}
				});

				return array;
			} else {
				return array;
			}
		},

		/*
		 * validatePostCodeColumns
		 * 
		 * Asks the user for a new column name (to name the column with the newly
		 * extracted postcode) and creates a new column based on extracting the
		 * postcode from the column the user has selected.
		 * 
		 * Recurse through the columns as each new column needs to be processed 
		 * once Refine has totally finished processing the previous column.
		 * 
		 */
		validatePostCodeColumns : function(index, callback) {

			var self = this;
			var colObjects = self.vars.colObjects;
			var i = index;

			/*
			 * Check to see if we have gone through every column, if we haven't, 
			 * check to see if the column has been specified to contain postcodes
			 */
			if (i >= colObjects.length) {
				callback();
			} else if (colObjects[i].containsPostcode || colObjects[i].part == "postcode") {

				/*
				 * We create a new column based on the specified postcode column (
				 * 
				 * partition() is the GREL function used to perform the regex match. It returns 
				 * an array of 3 elements - the middle element being the regex match.
				 * 
				 * The expression ends with "[1]" so we grab the middle element (the
				 * postcode value) of the returned 3-part regex result.
				 * 
				 */
				Refine.postCoreProcess(
						"add-column",
						{
							baseColumnName : colObjects[i].name,
							expression : "partition(value,/"+ self.vars.postCodeRegex + "/)[1]",
							newColumnName : colObjects[i].name + " Postcode (LG)",
							columnInsertIndex : Refine.columnNameToColumnIndex(colObjects[i].name) + 1,
							onError : "keep-original"
						},
						null,
						{
							modelsChanged : true
						},
						{
							onDone : function() {

								/*
								 * If the column selected had other address
								 * parts in it, then we don't want to remove
								 * it.
								 */
								if (colObjects[i].part == "mixed") {

									/*
									 * We need to add a new column object to the array for the new postcode 
									 * column that has just been created.
									 */
									colObjects.splice(colObjects.length, 0, {
										name : colObjects[i].name + " Postcode (LG)",
										part : "postcode",
										containsPostcode : true
									});

									i++;

									/*
									 * Prevent further recursion
									 */
									if (colObjects.length == 2) {
										callback();
									} else {
										self.validatePostCodeColumns(i, callback);
									}

								} else {

									// Remove the old postcode column
									LinkedGov.silentProcessCall({
										type : "POST",
										url : "/command/" + "core" + "/" + "remove-column",
										data : {
											columnName : colObjects[i].name
										},
										success : function() {

											/*
											 * After removing the old postcode column, we want to give the new column
											 * the same name as the old column.
											 */
											LinkedGov.silentProcessCall({
												type : "POST",
												url : "/command/" + "core" + "/" + "rename-column",
												data : {
													oldColumnName : colObjects[i].name + " Postcode (LG)",
													newColumnName : colObjects[i].name
												},
												success : function() {

													/*
													 * Locate the old postcode column in the column object array and 
													 * update it's name and options to the new postcode column.
													 */
													for ( var j = 0; j < colObjects.length; j++) {
														if (colObjects[j].name == colObjects[i].name) {
															colObjects[j] = {
																	name : colObjects[i].name,
																	part : "postcode",
																	containsPostcode : true
															};
														}
													}

													i++;
													self.validatePostCodeColumns(i, callback);
												},
												error : function() {
													self.onFail("A problem was encountered when renaming the column: \""
															+ colObjects[i].name
															+ " Postcode (LG)\".");
												}
											});
										},
										error : function() {
											self.onFail("A problem was encountered when removing the column: \""
													+ colObjects[i].name
													+ "\".");
										}
									});

								}

							}
						});

			} else {
				i++;
				self.validatePostCodeColumns(i, callback);
			}

		},

		/*
		 * makeAddressFragments
		 * 
		 * Loops through the column objects and constructs the URIs & CURIEs for 
		 * the different address fragments before storing each columns RDF in their 
		 * relevant column object.
		 */
		makeAddressFragments : function(callback) {

			log("makeAddressFragments");
			
			var self = this;
			var colObjects = self.vars.colObjects;
			var vocabs = self.vars.vocabs;
			var uri, curie = "";

			/*
			 * Loop through the colObject parts, which can be:
			 *  - postcode (make an OSPC RDF fragment) 
			 *  - street-address 
			 *  - extended-address 
			 *  - postal-code 
			 *  - locality 
			 *  - country-name
			 *  - mixed
			 */
			for ( var i = 0; i <= colObjects.length; i++) {

				/*
				 * Call the callback function here instead of after the for loop as it sometimes 
				 * gets called before it's finished iterating.
				 */
				if (i == colObjects.length) {
					callback();
				} else {

					/*
					 * The only special cases for the address fragment RDF
					 * are the "postcode" fragment and a "mixed" address. The others
					 * all share similar RDF.
					 * 
					 */
					switch (colObjects[i].part) {

					case "mixed":

						// TODO: What to store if mixed address?
						//log("mixed fragment");
						//log(colObjects[i]);

						break;

					case "postcode":

						/*
						 * Create the vCard postcode RDF
						 */
						uri = vocabs.vcard.uri + colObjects[i].part;
						curie = vocabs.vcard.curie + ":" + colObjects[i].part;
						colObjects[i].rdf = self.makeVCardFragment(colObjects[i].name, uri, curie);
						/*
						 * Create the OSPC postcode RDF
						 */
						uri = vocabs.ospc.uri + colObjects[i].part;
						curie = vocabs.ospc.curie + ":" + colObjects[i].part;
						colObjects[i].ospcRdf = self.makeOSPCFragment(colObjects[i].name, uri, curie, vocabs.ospc.resourceURI);
						break;

					default:

						/*
						 * Create the other vCard address fragments
						 */
						uri = vocabs.vcard.uri + colObjects[i].part;
						curie = vocabs.vcard.curie + ":" + colObjects[i].part;
						colObjects[i].rdf = self.makeVCardFragment(colObjects[i].name, uri, curie);
						break;

					}
				}

			}

		},

		/*
		 * saveRDF
		 * 
		 * Builds the vCard:Address node, which is typed as a location, and adds the 
		 * various address fragments to it before adding it to the RDF schema.
		 */
		saveRDF : function(rootNode, newRootNode) {

			log("saveRDF");

			var self = this;
			var elmts = this.vars.elmts;
			var colObjects = self.vars.colObjects;

			/*
			 * Any address data will always be the child of a vCard:Address node, 
			 * which are identified using the hash ID "#location".
			 */
			var vcardObj = {
					"uri" : self.vars.vocabs.lg.uri+"location",
					"curie" : self.vars.vocabs.lg.curie+":location",
					"target" : {
						"nodeType" : "cell-as-resource",
						"expression" : "value+\"#address\"",
						"isRowNumberCell" : true,
						"rdfTypes" : [ {
							"uri" : "http://www.w3.org/2006/vcard/ns#Address",
							"curie" : "vcard:Address"
						} ],
						"links" : []
					}
			};

			/*
			 * Loop through the column objects and add their RDF, with an extra 
			 * push of RDF for the postcode fragment which contains slightly different RDF 
			 * data to the other fragments.
			 */
			for ( var i = 0; i < colObjects.length; i++) {

				if (colObjects[i].containsPostcode && colObjects[i].part == "postcode") {
					vcardObj.target.links.push(colObjects[i].ospcRdf);
				}
				if (typeof colObjects[i].rdf != 'undefined') {
					vcardObj.target.links.push(colObjects[i].rdf);
				}
			}

			/*
			 * Add the RDF to the schema
			 */
			rootNode.links.push(vcardObj);
			var schema = LinkedGov.getRDFSchema();
			if (!newRootNode) {
				log("rootNode has already been updated...");
			} else {
				log("Adding first rootNode for address data...");
				schema.rootNodes.push(rootNode);
			}

			/*
			 * Save the RDF.
			 */
			Refine.postProcess("rdf-extension", "save-rdf-schema", {}, {
				schema : JSON.stringify(schema)
			}, {}, {
				onDone : function() {
					// DialogSystem.dismissUntil(self._level - 1);
					// theProject.overlayModels.rdfSchema = schema;
					self.onComplete();
				}
			});

		},

		/*
		 * makeVCardFragment
		 * 
		 * Returns part of the RDF plugin's schema for a fragment of a vCard
		 * address.
		 */
		makeVCardFragment : function(colName, uri, curie) {
			
			var o = {
					"uri" : uri,
					"curie" : curie,
					"target" : {
						"nodeType" : "cell-as-literal",
						"expression" : "value",
						"columnName" : colName,
						"isRowNumberCell" : false
					}
			}

			return o;
		},

		/*
		 * makeOSPCFragment
		 * 
		 * Constructs the RDF object for describing a postcode.
		 * 
		 * There's noticeably two levels to the object as we also give the postcode a label.
		 */
		makeOSPCFragment : function(colName, uri, curie, pcodeURI) {

			var self = this;
			
			var o = {
					"uri" : uri,
					"curie" : curie,
					"target" : {
						"nodeType" : "cell-as-resource",
						"expression" : "\"" + pcodeURI + "\"+value.replace(\" \",\"\")",
						"columnName" : colName,
						"isRowNumberCell" : false,
						"rdfTypes" : [

						              ],
						              "links" : [ {
						            	  "uri" : self.vars.vocabs.rdfs.curie+"label",
						            	  "curie" : self.vars.vocabs.rdfs.curie+":label",
						            	  "target" : {
						            		  "nodeType" : "cell-as-literal",
						            		  "expression" : "value",
						            		  "columnName" : colName,
						            		  "isRowNumberCell" : false
						            	  }
						              } ]
					}
			};

			return o;
		},

		/*
		 * onFail
		 */
		onFail : function(message) {
			var self = this;
			alert("Address wizard failed.\n\n" + message);
			LinkedGov.resetWizard(self.vars.elmts.addressBody);
			LinkedGov.showWizardProgress(false);
		},

		/*
		 * Return the wizard to its original state.
		 */
		onComplete : function() {
			var self = this;
			LinkedGov.resetWizard(self.vars.elmts.addressBody);
			Refine.update({
				modelsChanged : true
			}, function() {
				LinkedGov.showWizardProgress(false);
			});
		}
};