/*
 * LinkedGov UI skin for Google Refine
 * 
 * Author: Dan Smith
 * 
 * The "Typing" panel UI object
 * 
 * Follows the same structure as the facet and history
 * panels.
 * 
 * - Houses column selection functions
 * - Creates the dynamic content for the wizards when selecting columns
 * - Handles all user interaction for the typing panel, it's wizards 
 * and the labels and descriptions panel.
 * - Provides validation for the labels and descriptions panel
 * 
 */

/*
 * Constructor for the typing panel
 */
function TypingPanel(div) {
	this._div = div;
	this.update();
}

/*
 * Resize function - similar to the other panels
 * 
 * TODO: Perhaps use CSS instead of a resize function?
 */
TypingPanel.prototype.resize = function () {
	var body = this._div.find(".typing-panel-body");

	var bodyPaddings = body.outerHeight(true) - body.height();
	body.height((this._div.height() - bodyPaddings) + "px");
	body[0].scrollTop = body[0].offsetHeight;
};

/*
 * Update function
 */
TypingPanel.prototype.update = function (onDone) {
	var self = this;
	self._render();
};

/*
 * _render
 * 
 * - Initialises the autosuggestion box for the measurements wizard
 * - Attachers listeners to the wizard "Update" buttons
 * - Resizes the panel
 */
TypingPanel.prototype._render = function () {

	var self = this;

	var elmts = DOM.bind(self._div);

	/*
	 * When each wizards' "Update" button is clicked, 
	 * their corresponding wizard function is called. Each of the 
	 * wizards have "bind" attributes in their HTML code, which 
	 * allows access to the individual elements through the object
	 * "elmts".
	 */

	$("a[bind='dateTimeButton']").live("click",function () {
		self.destroyColumnSelector();
		LinkedGov.dateTimeWizard.initialise(DOM.bind(self._div));
	});

	$("a[bind='measurementsButton']").live("click",function () {
		self.destroyColumnSelector();
		LinkedGov.measurementsWizard.initialise(DOM.bind(self._div));
	});

	$("a[bind='latLongButton']").live("click",function(){
		self.destroyColumnSelector();
		LinkedGov.latLongWizard.initialise(DOM.bind(self._div));	 
	});

	$("a[bind='addressButton']").live("click",function () {
		self.destroyColumnSelector();
		LinkedGov.addressWizard.initialise(DOM.bind(self._div));
	});

	$("a[bind='multipleColumnsButton']").live("click",function () {
		self.destroyColumnSelector();
		LinkedGov.multipleColumnsWizard.initialise(DOM.bind(self._div));
	});

	$("a[bind='multipleValuesButton']").live("click",function () {
		self.destroyColumnSelector();
		LinkedGov.multipleValuesWizard.initialise(DOM.bind(self._div));
	});

	/*
	 * Called similarly to Refine's panels.
	 */
	this.resize();
};

/*
 * enterWizard
 * 
 * Slides the questions away and the selected wizard in.
 */
TypingPanel.prototype.enterWizard = function(wizardName) {

	$("div.wizard-panel").html(DOM.loadHTML("linkedgov", "html/project/"+wizardName+".html",function(){		
		$("div.typing-panel-body").animate({"left":"-300px"},500);
		$("div.cancel-button").animate({"left":"0px"},500);
		$("div.next-button").animate({"left":"-300px"},500);
		$("div.wizard-panel").animate({"left":"0px"},500,function(){

			// show the update button at the bottom of the wizard
			$("div.update-button").show();

			// show the info icon
			$("a.info").show();

			//Wire the sticky update button to the wizards specific update button
			$("div.update-button a.button").attr("bind",$("div.wizard-body").find("a.update").attr("bind"));

			/*
			 * Perform some JS initialisation specific to the wizard
			 */
			switch(wizardName){

			case "measurement-wizard" : 

				// make the measurements text field auto suggest
				$("#unitInputField").suggest().bind("fb-select", function (e, data) {
					//alert(data.name + ", " + data.id);
				});

				break;

			case "rangecolumns-wizard" :

				/*
				 * If the wizard contains a range selector, retrieve the 
				 * column header names and populate the select inputs.
				 */
				$("div.rangeSelect").find("div.selector").children("div.range").hide();
				ui.typingPanel.populateRangeSelector($("div.rangeSelect").find("div.selector").children("div.range"), function(){
					$("div.rangeSelect").find("div.selector").children("div.range").slideDown();					
				});

				break;
			case "datetime-wizard" :

				break;
			default:
				break;

			}

		});
	}));

}

/*
 * exitWizard
 * 
 * Slide the wizard away and the questions back in.
 */
TypingPanel.prototype.exitWizard = function(){

	$("div.update-button").animate({"left":"300px"},500,function(){
		$(this).hide();
	});
	$("div.typing-panel-body").animate({"left":"0px"},500);
	$("div.description-panel").animate({"left":"300px"},500);
	$("div.cancel-button").animate({"left":"300px"},500);
	$("div.next-button").animate({"left":"0px"},500);
	$("div.wizard-panel").animate({"left":"300px"},500, function(){
		$("div.wizard-panel").find("div.wizard-body").remove();
	});
}


/*
 * enterDescriptionPanel
 * 
 * Slide the questions away and the labels & descriptions panel in.
 */
TypingPanel.prototype.enterDescriptionPanel = function(){

	/*
	 * If there the elements in the panel already exist, there's no need to create the 
	 * panel again, so just slide it in.
	 */
	if($("div.description-panel div.column-list ul li").length > 0){

		// list already built
		$("div.typing-panel-body").animate({"left":"-300px"},500);
		$("div.cancel-button").animate({"left":"0px"},500);
		$("div.next-button").animate({"left":"-300px"},500);
		$("div.description-panel").animate({"left":"0px"},500);
		$("div.description-panel div.update-button").show().animate({"left":"0px"},500);
	} else {

		// build new list
		$("div.description-panel").html(DOM.loadHTML("linkedgov", "html/project/description-panel.html",function(){		
			$("div.typing-panel-body").animate({"left":"-300px"},500);
			$("div.cancel-button").animate({"left":"0px"},500);
			$("div.next-button").animate({"left":"-300px"},500);
			$("div.description-panel").animate({"left":"0px"},500,function(){
				$("div.description-panel div.update-button").show().animate({"left":"0px"},500);
				ui.typingPanel.buildDescriptionPanel();
			});
		}));

	}
}

/*
 * buildDescriptionPanel
 * 
 * If it's the first time the user has entered the labels and descriptions panel, 
 * the input elements need to built and populated with the column headers - or - 
 * any existing labels and descriptions from a previous session.
 */
TypingPanel.prototype.buildDescriptionPanel = function() {

	//log("buildDescriptionPanel");

	/*
	 * Create the input fields for the column labels and descriptions - adding 
	 * a CSS class to them to highlight their acceptability status.
	 */
	$("div.description-panel div.column-list").hide();
	var html = "<ul>";
	$("div.column-header-title span.column-header-name").each(function(){
		if($(this).html() != "All"){
			/*
			 * Column name status can be:
			 * great - label and description entered
			 * good - user has entered a name
			 * bad - is blank or contains the word "column"
			 * maybe - could be fine
			 */
			var status = "maybe";
			if($(this).html().length < 2 || $(this).html().toLowerCase().indexOf("column") > -1){
				status = "bad";
			}
			html += "<li class='"+status+"'>" +
			"<input class='column-label' value='"+$(this).html()+"' />" +
			"<textarea class='column-description' value='Enter a description...'>Enter a description...</textarea>" + 
			"</li>";
			$(this).addClass(status);
		}
	});
	html += "</ul>";
	$("div.description-panel div.column-list").html(html);

	/*
	 *  Attempts to load the labels and descriptions of the rows and columns from the temporary 
	 *  global 'labelsAndDescription' object.
	 *  
	 *  The global labels object is used to temporarily store the labels and descriptions in the 
	 *  labels and descriptions panel so the user can switch between the panels without losing any 
	 *  information they have entered.
	 *  
	 *  The labels and descriptions are properly stored in RDF once the user clicks "Save".
	 */
	var labelData = LinkedGov.vars.labelsAndDescriptions; 
	var colData = labelData.cols;
	/*
	 * If the global labels object 
	 */
	if(colData.length > 0){
		for(var i=0;i<colData.length;i++){
			$("div.description-panel div.column-list ul li").each(function(){

				if($(this).find("input.column-label").val() == colData[i].name){
					//log("Replacing description for "+colData[i].name+": "+colData[i].description);
					$(this).find("textarea.column-description").val(colData[i].description).html(colData[i].description);
					ui.typingPanel.checkColumnDescription($(this));
				}

				$(this).find("input.column-label").data("original-name",$(this).find("input.column-label").val());
			});
		}
	} else {
		/*
		 * If the globals labels object doesn't exist, try to load the labels from the RDF schema.
		 */
		ui.typingPanel.loadLabelsAndDescription(function(){
			$("div.description-panel div.column-list").slideDown(1000,function(){

				/*
				 * Store the row label and description
				 */
				labelData.rowLabel = $("div.row-decsription input.row-name").val();
				labelData.rowDescription = $("div.row-description textarea.row-description").val();

				/*
				 * Validate the row label and description
				 */
				ui.typingPanel.checkRowDescription($("div.description-panel div.row-description"));

				/*
				 * Populate a global labels object of column names and description so the user can 
				 * switch between panels before saving and not lose their input values.
				 */
				$("div.description-panel div.column-list ul li").each(function(){
					colData.push({
						name:$(this).find("input.column-label").val(),
						description:$(this).find("textarea.column-description").val()
					});
					$(this).find("input.column-label").data("original-name",$(this).find("input.column-label").val());
					ui.typingPanel.checkColumnDescription($(this));
				});


			});
		});
	}

	/*
	 * Add an on "focus" listener to the row label and description inputs
	 */
	$("div.description-panel div.row-description input, " +
	"div.description-panel div.row-description textarea").live("focus",function(){
		$("table.data-table > tbody > tr.odd > td ").css("background-color","#DAFFD9");
		if($(this).hasClass("row-label") && $(this).val() == "Enter a label..."){
			$(this).val("");
		} else if($(this).hasClass("row-description") && $(this).val() == "Enter a description..."){
			$(this).val("");
		}
	});
	/*
	 * Add an on "blur" listener to the row label and description inputs
	 */
	$("div.description-panel div.row-description input, " +
	"div.description-panel div.row-description textarea").live("blur",function(){
		$("table.data-table > tbody > tr.odd > td ").css("background-color","#F2F2F2");
		if($(this).hasClass("row-label") && $(this).val() == ""){
			$(this).val("Enter a label...");
		} else if($(this).hasClass("row-description") && $(this).val() == ""){
			$(this).val("Enter a description...");
		}
		ui.typingPanel.checkRowDescription($(this).parent());
	});
	/*
	 * Add an on "key up" listener to the row label and description inputs
	 */
	$("div.description-panel div.row-description input, " +
	"div.description-panel div.row-description textarea").live("keyup",function(){
		ui.typingPanel.checkRowDescription($(this).parent());
	});

	/*
	 * Add an on "focus" listener to the column label and description inputs
	 */
	$("div.description-panel div.column-list ul li input.column-label, " +
	"div.description-panel div.column-list ul li textarea.column-description").live("focus",function(){

		var colName = $(this).parent("li").find("input.column-label").val();

		/*
		 * Highlight the column in the data table when the user focuses on their 
		 * label or description input.
		 */
		$("div.column-header-title span.column-header-name").each(function(){
			if($(this).html() == colName){
				$(this).parent("div").parent("td").addClass("selected");
			} else {
				$(this).parent("div").parent("td").removeClass("selected");
			}
		});

		/*
		 * Remove the holding text upon focus.
		 */
		if($(this).val() == "Enter a description..."){
			$(this).val("");
		}
	});
	
	/*
	 * Add an on "blur" listener to the column label and description inputs
	 */
	$("div.description-panel div.column-list ul li input.column-label, " +
	"div.description-panel div.column-list ul li textarea.column-description").live("blur",function(){

		var el = $(this);
		var colName = $(this).parent("li").find("input.column-label").val();

		/*
		 * Remove the highlight from the column in the data table.
		 */
		$("div.column-header-title span.column-header-name").each(function(){
			if($(this).html() == colName){
				$(this).parent("div").parent("td").removeClass("selected");
			}
		});
		/*
		 * Replace the holding text if the description wasn't filled out properly.
		 */
		if($(this).hasClass("column-description") && $(this).val() == ""){
			$(this).val("Enter a description...");
		}
		/*
		 * Validate the label and description.
		 */
		ui.typingPanel.checkColumnDescription($(this).parent());

		/*
		 * Rename column if the status is 'good'/'great' & has been changed
		 */
		if($(this).hasClass("column-label") && $(this).data("original-name") != el.val()){

			if($(this).parent("li").hasClass("maybe") || $(this).parent("li").hasClass("good") || $(this).parent("li").hasClass("great")){
				
				/*
				 * The old labels of the columns are stored using the elements "data" property as  
				 * a temporary holding spot. This gets overriden whenever the label is changed for the 
				 * better.
				 */
				var oldName = $(this).data("original-name");
				var newName = el.val();

				for(var i=0;i<colData.length;i++){
					if(colData[i].name == oldName){
						colData[i].name = newName;
						colData[i].description = el.parent().find("textarea").val();
					}
				}

				LinkedGov.renameColumn(oldName,newName,function(){

					/*
					 * Rename the column name in the RDF schema too
					 */
					LinkedGov.renameColumnInRDF.start(oldName,newName,function(){
						Refine.update({modelsChanged:true});
					});

					/*
					 * Store the new column label as the original label.
					 */
					el.data("original-name",el.val());

				});

			} else {
				/*
				 * Restore the input field value using it's original label.
				 */
				el.val(el.data("original-name"));
			}
		}
	});

	/*
	 * Interaction when pressing a key in the column label or description input fields
	 */
	$("div.description-panel div.column-list ul li input.column-label, " +
	"div.description-panel div.column-list ul li textarea.column-description").live("keyup",function(){
		ui.typingPanel.checkColumnDescription($(this).parent());
	});

	/*
	 * Save button functionality
	 */
	$("div.description-panel a.save").live("click",function(){

		/*
		 * Save the description data as RDF
		 * 
		 * Save any columns without RDF with generic RDF using 
		 * their column names as properties.
		 * 
		 * Perform some basic validation so that the user must make sure all labels 
		 * are correctly entered to a certain level of acceptability.
		 */
		var error = false;
		if($("div.row-description").hasClass("maybe") || $("div.row-description").hasClass("bad")){
			error = true;
		}
		$("div.column-list ul li").each(function(){
			if($(this).hasClass("maybe") || $(this).hasClass("bad")){
				error = true;
			}
		});
		if(error){
			alert("Some labels still need to be checked, please make sure you have checked the row description and all of the columns.")
		} else {
			LinkedGov.finaliseRDFSchema.init();
		}
	});

}



/*
 * loadLabelsAndDescription
 * 
 * Loop through the root nodes in the RDF schema, locating the 
 * row and column label and descriptions, using them to populate 
 * the input fields in the labels and descriptions panel.
 * 
 */
TypingPanel.prototype.loadLabelsAndDescription = function(callback) {

	/*
	 * Make sure the RDF schema exists
	 */
	if (typeof theProject.overlayModels != 'undefined' && typeof theProject.overlayModels.rdfSchema != 'undefined') {

		var schema = theProject.overlayModels.rdfSchema;

		/*
		 * Loop throught the RDF root nodes and test the RDF type.
		 */
		for(var i=0; i<schema.rootNodes.length; i++){
			if(typeof schema.rootNodes[i].rdfTypes != 'undefined' && schema.rootNodes[i].rdfTypes.length > 0) {

				/*
				 * If the RDF type is owl:Class then we've found the row label & description
				 */
				if(schema.rootNodes[i].rdfTypes[0].curie == "owl:Class"){
					for(var j=0; j<schema.rootNodes[i].links.length; j++){
						/*
						 * Locate the label and comment and populate the input fields
						 */
						if(schema.rootNodes[i].links[j].curie == "rdfs:label"){
							$("div.row-description input.row-label").val(schema.rootNodes[i].links[j].target.value);
						} else if(schema.rootNodes[i].links[j].curie == "rdfs:comment"){
							$("div.row-description textarea.row-description").val(schema.rootNodes[i].links[j].target.value);
						}
					}

				} else if(schema.rootNodes[i].rdfTypes[0].curie == "owl:ObjectProperty") {
					/*
					 * If the type is owl:ObjectProperty, we've found a column label & description
					 */
					if(schema.rootNodes[i].links.length == 2 && schema.rootNodes[i].links[0].curie.indexOf("rdfs") >= 0){
						for(var j=0; j<schema.rootNodes[i].links.length; j++){
							if(schema.rootNodes[i].links[j].curie == "rdfs:label"){		
								/*
								 * Loop through the panel inputs and locate the input with the matching 
								 * column label
								 */
								$("div.column-list ul li").each(function(){
									if($(this).find("input.column-label").val() == schema.rootNodes[i].links[j].target.value){
										/*
										 * For the "link" object found to contain the label, use the other link object (the comment) 
										 * to populate the column's description input.
										 */
										$(this).find("textarea.column-description")
										.val(schema.rootNodes[i].links[(j?0:1)].target.value)
										.html(schema.rootNodes[i].links[(j?0:1)].target.value);
									}
								});
							}
						}
					}
				}
			}
		}

		callback();

	} else {
		callback();
		return false;
	}
}


/*
 * checkRowDescription
 * 
 * Validates the input for the row label and description on interaction.
 */
TypingPanel.prototype.checkRowDescription = function(divElement){

	var input = divElement.find("input.row-label");
	var textarea = divElement.find("textarea.row-description");
	var labelData = LinkedGov.vars.labelsAndDescriptions;

	/*
	 * Add the status's CSS class
	 */
	if(input.val().trim().length > 2 && input.val() != "Enter a label..."){
		divElement.removeClass("bad").removeClass("maybe").addClass("good");
		if(textarea.val().length > 2 && textarea.val() != "Enter a description..."){
			divElement.addClass("great");
		} else {
			divElement.removeClass("great").addClass("good");
		}
	} else {
		divElement.removeClass("great").removeClass("good").addClass("bad");
	}

	/*
	 * Store the values in the global labels object.
	 */
	labelData.rowLabel = input.val();
	labelData.rowDescription = textarea.val();

}

/*
 * checkColumnDescription
 * 
 * Validates and styles the inputs for the column labels and descriptions.
 */
TypingPanel.prototype.checkColumnDescription = function(liElement){

	var input = liElement.find("input.column-label");
	var textarea = liElement.find("textarea.column-description");

	var colData = LinkedGov.vars.labelsAndDescriptions.cols;

	/*
	 * If the column label is longer than 2 letters and doesn't contain the word column
	 */
	if(input.val().trim().length > 2 && input.val().toLowerCase().indexOf("column") < 0){
		liElement.removeClass("bad").removeClass("maybe").addClass("good");
		/*
		 * If the description value is not equal to the holding text, add the "great" 
		 * status.
		 */
		if(textarea.val().length > 2 && textarea.val() != "Enter a description..."){
			liElement.addClass("great");
		}
	} else {
		liElement.removeClass("great").removeClass("good").addClass("bad");
	}

	/*
	 * Store the column description in the local object.
	 */
	for(var i=0;i<colData.length;i++){
		if(colData[i].name == input.val()){
			colData[i].description = textarea.val();
		}
	}
}


/*
 * populateRangeSelector
 * 
 * Takes a div.range element that contains two select inputs as children and 
 * populate the select inputs with the column names and sets them to the first 
 * option.
 */
TypingPanel.prototype.populateRangeSelector = function(divRange, callback) {

	callback = callback || function(){return false};

	var columnHeaders = "";
	var i = 0;
	/*
	 * Grab the column names from the data table and present 
	 * them as <option> elements.
	 * TODO: Perhaps grab the names from Refine's DOM object 
	 * instead.
	 */
	$("div.column-header-title span.column-header-name").each(function () {
		if ($(this).html() != "All") {
			columnHeaders += "<option data-id='" + i + "' value='" + $(this).html() + "'>" + $(this).html() + "</option>";
			i++;
		}
	});
	/*
	 * Populate the select inputs with the <option> elements.
	 */
	divRange.children("select").each(function () {
		$(this).html(columnHeaders);
		$(this).val($(this).find("option").eq(0).val());
	});

	callback();

}

/*
 * buttonSelector
 * 
 * Upon clicking the "Select" button in each wizard to select columns, 
 * the jQuery UI "selectable" plugin is invoked and the callbacks for 
 * for the selection actions populate a list in the wizard.
 */
TypingPanel.prototype.buttonSelector = function(button, mode) {

	var self = this;
	/* 
	 * mode can be used to generate different HTML for the select columns.
	 * 
	 * e.g. Select columns for the date and time wizard are different to the 
	 * columns selected for the address wizard as they need to contain different 
	 * options.
	 */
	var mode = mode || "default";

	/*
	 * If the button is labelled "Start Select", then the user is wanting to 
	 * select columns.
	 */
	if ($(button).html() == "Start Select") {

		/*
		 * Remove any existing column selectors on the page
		 */
		self.destroyColumnSelector();

		/*
		 * Cache the location of the selected columns (some may already be present)
		 */
		$cols = $(button).parent().children("ul.selected-columns");
		
		/*
		 * Change the button label to "End Select"
		 */
		$(button).html("End Select");

		/*
		 * Cache the global "ui" object because it clashes with jQuery UI's selectable "ui" object below.
		 */
		var RefineUI = ui;

		/*
		 * Invoke the "selectable" plugin on the data table, and only allow the user to select 
		 * "td.column-header" elements, then handle the various interactions.
		 */
		$("table.data-header-table").selectable({
			filter: 'td.column-header',
			selected: function (event, ui) {
				/*
				 * Element selected.
				 * 
				 * If the selected column is not the "All" column
				 */
				if($(ui.selected).children().find(".column-header-name").html() != "All"){
					/*
					 * Assume it will be added to the list of selected columns
					 */
					var addToList = true;
					/*
					 * Loop through any existing select columns in the list 
					 */
					$cols.children("li").children("span.col").each(function(){
						/*
						 * Check if selected column already exists in the list.
						 * 
						 * If it already exists, assume the user is wanting to 
						 * deselect the column.
						 */
						if($(this).html() == $(ui.selected).children().find(".column-header-name").html()){

							/*
							 * Remove the column from the select columns list and remove the highlighted 
							 * "ui-selected" class from the column header in the data table.
							 */
							$(this).parent("li").remove();
							$(ui.selected).removeClass("ui-selected");

							/*
							 * Check to see if there are any selected columns still present in the list, 
							 * which if there aren't, hide the list.
							 */
							if($cols.children("li").length < 1){
								$cols.html("").hide();
							} else {
								$cols.show();
							}
							/*
							 * If a selected column exists in the list, but hidden by the 
							 * "skip" class, then show the selected column again.
							 */
							if($(this).parent().hasClass("skip")){
								$(this).parent().removeClass("skip").show();
							}

							/*
							 * If the column already exists in the list, then we don't want to 
							 * add another entry for it.
							 */
							addToList = false;
						}
					});
					
					/*
					 * If the selected column doesn't already exist in the selected columns list,
					 * create an entry in the list for it, depending on the mode parameter for the 
					 * column list.
					 * 
					 * Each mode calls the getFragmentData() function, passing the column-list that 
					 * has a class attached to the element to determine what HTML to inject into each 
					 * column entry.
					 */
					if(addToList){
						switch(mode){
						case "default" :
							/*
							 * default - allows multiple columns to be added to the list.
							 */
							$cols.append( 
									"<li>" +
									"<span class='col'>" + 
									$(ui.selected).children().find(".column-header-name").html() + 
									"</span>" + 
									"<span class='remove'>X</span>" +
									RefineUI.typingPanel.getFragmentData($cols) +
									"</li>"
							)
							.show();
							break;
						case "single-column" :
							/*
							 * single-column - only allows one column to be selected - hence the use 
							 * of html() instead of append().
							 */
							$cols.html( 
									"<li>" +
									"<span class='col'>" + 
									$(ui.selected).children().find(".column-header-name").html() + 
									"</span>" + 
									"<span class='remove'>X</span>" +
									RefineUI.typingPanel.getFragmentData($cols) +
									"</li>"
							)
							.show();							
							break;
						case "splitter" :
							/*
							 * splitter - only allows one column to be selected and doesn't ask 
							 * for any fragment data. Used
							 */
							$cols.html(
									"<li>" +
									"<span class='col'>" + 
									$(ui.selected).children().find(".column-header-name").html() + 
									"</span>" + 
									"<span class='remove'>X</span>" +
							"</li>")
							.show();	
							break;
					}
				}
			},
			unselected: function (event, ui) {
				$cols.children("li").children("span.col").each(function(){
					if($(this).html() == $(ui.unselected).children().find(".column-header-name").html()){
						$(this).parent("li").remove();
					}
				});
			},
			selecting: function (event, ui) {
				// log("selecting");
			},
			unselecting: function (event, ui) {
				// log("unselecting");
				//$cols.html("").hide();
			}
		});
	} else {
		self.destroyColumnSelector();
	}	
}



/*
 * rangeSelector
 * 
 * On the range selects' input change, rangeSelector is called.
 * 
 * It adds basic validation to the select inputs so that when 
 * a value is picked in the "From" range select, all values before 
 * that value in the "To" range select are disabled, and vice versa.
 */
TypingPanel.prototype.rangeSelector = function(select) {

	var self = this;
	self.destroyColumnSelector();

	$cols = $(select).parent().parent().children("ul.selected-columns");
	$cols.html("").hide();
	var colsHTML = "";
	var from = 0, to = 0;

	if ($(select).hasClass("from")) {
		// Limit the "to" select input
		// Check to see if the other input has been set and
		// adjust the column list
		from = parseInt($(select).find("option[value='" + $(select).val() + "']").attr("data-id"));
		$(select).parent().find("select.to").children("option").each(function() {
			if (parseInt($(this).attr("data-id")) <= from) {
				$(this).attr("disabled", "true");
			} else {
				$(this).removeAttr("disabled");
			}
		});
	} else if ($(select).hasClass("to")) {
		// Limit the first select input
		// Check to see if the other input has been set and
		// adjust the column list
		to = parseInt($(select).find("option[value='" + $(select).val() + "']").attr("data-id"));
		$(select).parent().find("select.from").children("option").each(function () {
			if (parseInt($(this).attr("data-id")) >= to) {
				$(this).attr("disabled", "true");
			} else {
				$(this).removeAttr("disabled");
			}
		});
	}

	$(select).find("option").each(function () {
		if (parseInt($(this).attr("data-id")) >= parseInt($(this).parent().parent().children("select.from").find("option[value='" + $(this).parent().parent().children("select.from").val() + "']").attr("data-id")) 
				&& parseInt($(this).attr("data-id")) <= parseInt($(this).parent().parent().children("select.to").find("option[value='" + $(this).parent().parent().children("select.to").val() + "']").attr("data-id"))) {
			/*
			 * Populate the wizards column display.
			 * <li><span>Column Name</span><select>Fragment data</select><span>Remove column</span></li>
			 */
			colsHTML += "<li>" +
			"<span class='col'>" + $(this).val() + "</span>" +  
			"<span class='remove'>X</span>" +
			ui.typingPanel.getFragmentData($cols) +
			"</li>";
			/*
			 * Add jQuery UI's "selected" styles to the column headers in the
			 * data table.
			 * 
			 * TODO: Inefficient iteration.
			 */
			$colName = $(this).val();
			$("table.data-header-table tr td.column-header span.column-header-name").each(function(){
				if($(this).html() == $colName){
					$(this).parent().parent("td").addClass("ui-selected");
					$("table.data-header-table").addClass("ui-selectable");
				}
			});
		}
	});

	if(colsHTML == ""){

	} else {
		$cols.html(colsHTML).show();
	}

}

/*
 * Destroys the jQuery UI 'selectable' object when a new wizard 
 * is started/finished.
 */
TypingPanel.prototype.destroyColumnSelector = function() {
	$("div.selector a.selectColumn").html("Start Select");
	$("table.data-header-table").selectable("destroy");
	$("table.data-header-table .column-header").each(function () {
		$(this).removeClass("ui-selected").removeClass("skip");
	});	
}

/*
 * removeColumn
 * 
 * Updates column selector when removing a column
 */
TypingPanel.prototype.removeColumn = function(el) {

	/*
	 * Slide up column, apply "skip" class which has display:none.
	 * Remove ui-selected from column header.
	 */

	/*
	 * Check to see if column being removed is the first or last 
	 * in column selection, in which case it is ok to remove from 
	 * the range.
	 */
	$cols = $(el).parent("li").parent("ul");

	if($(el).parent("li")[0] === $(el).parent().parent("ul").children().eq(0)[0] || $(el).parent("li")[0] == $(el).parent("li").parent("ul").children("li").eq($(el).parent("li").parent("ul").children("li").length-1)[0]){

		$(el).parent().slideUp(250,function(){

			$(this).remove();

			while($cols.children("li").length > 0 && $cols.children("li").eq(0).hasClass("skip")){
				$cols.children("li").eq(0).remove();
			}

			if($cols.children("li").length < 1){
				$cols.html("").hide();
			}
		});
		/*
		 * Remove the "selected" styling for the removed columns in the data table
		 */
		$li_el = $(el).parent("li");

		$("td.column-header div.column-header-title span.column-header-name").each(function(){
			if($(this).html() == $li_el.find("span.col").html()){
				$(this).parent().parent("td").removeClass("ui-selected");
			}
		});

	} else {
		/*
		 * If the column is within the range, add the class "skip" to 
		 * the <li> element to hook on to during the wizard.
		 */
		if($(el).parent("li").hasClass("skip")){
			$(el).parent().removeClass("skip");
			$li_el = $(el).parent("li");

			$("td.column-header div.column-header-title span.column-header-name").each(function(){
				if($(this).html() == $li_el.find("span.col").html()){
					$(this).parent().parent("td").addClass("ui-selectee ui-selected");
				}
			});
		} else {			
			$li_el = $(el).parent("li");

			$li_el.slideUp(250,function(){
				$(this).addClass("skip");
			});

			$("td.column-header div.column-header-title span.column-header-name").each(function(){
				if($(this).html() == $li_el.find("span.col").html()){
					$(this).parent().parent("td").removeClass("ui-selectee ui-selected");
				}
			});	
		}
	}

}

/*
 * getFragmentData
 * 
 * Returns the HTML for the select inputs for certain wizards 
 * if the user is required to map data fragments for columns.
 */
TypingPanel.prototype.getFragmentData = function(columnList) {

	var fragmentHTML = "";

	switch (columnList.attr("bind")) {
	case "dateTimeColumns" :

		fragmentHTML = "<span class='dateFrags colOptions'>";

		var symbols = ["Y","M","D","h","m","s"];
		for(var i=0;i<symbols.length;i++){
			fragmentHTML += "<input type='checkbox' class='date-checkbox' value='"+symbols[i]+"' /><span>"+symbols[i]+"</span>";
		}

		fragmentHTML += "</span>";

		// Option to specify that the date/time is a duration
		fragmentHTML += "<span class='colOptions duration'>" +
		"<input type='checkbox' class='duration' value='duration' />" +
		"<span>Duration</span>" +
		"<div class='duration-input'>" + 
		"<input class='duration-value' type='text' />" +
		"<select class='duration'>" +
		"<option value='seconds'>seconds</option>" +
		"<option value='minutes'>minutes</option>" +
		"<option value='hours'>hours</option>" +
		"<option value='days'>days</option>" +
		"<option value='months'>months</option>" +
		"<option value='years'>years</option>" +
		"</select>" +
		"</div>" +
		"</span>";

		// Option for specifying the order of day and month
		fragmentHTML += "<span class='colOptions mb4d'>" +
		"<input type='checkbox' class='mb4d' value='mb4d' />" +
		"<span>Month before day (e.g. 07/23/1994)</span>" +
		"</span>";
		// Input for specifying the year the dates occur in
		fragmentHTML += "<span class='colOptions year'>" +
		"<span>Do you know the year?</span>" +
		"<input type='text' class='year' value='' maxlength='4' />" +
		"</span>";
		// Input for specifying the day the times occur on
		fragmentHTML += "<span class='colOptions day'>" +
		"<span>Do you know the day?</span>" +
		"<input id='datepicker-"+$.generateId()+"' type='text' class='day datepicker' value='' />" +
		"</span>";

		/*
		 * Add the "fragments" class to the list of columns so CSS styles can 
		 * be applied.
		 */
		columnList.addClass("date-checkboxes");
		break;
	case "addressColumns" :

		fragmentHTML = "<span class='colOptions'>";

		fragmentHTML += 
			"<select class='address-select'>" + 
			"<option value='street-address'>Street Address</option>" + 
			"<option value='extended-address'>Extended Address</option>" +
			"<option value='locality'>Locality</option>" + 
			"<option value='region'>Region</option>" + 
			"<option value='postcode'>Postcode</option>" + 
			"<option value='country-name'>Country</option>" + 
			"<option value='mixed'>Mixed</option>" + 
			"</select>";

		fragmentHTML += "</span>";

		// Option for specifying the order of day and month
		fragmentHTML += "<span class='colOptions postcode'>" +
		"<input type='checkbox' class='postcode' value='postcode' />" +
		"<span>Contains postcode</span>" +
		"</span>";

		/*
		 * Add the "fragments" class to the list of columns so CSS styles can 
		 * be applied.
		 */
		columnList.addClass("address-checkboxes");
		break;
	case "latLongColumns" :

		fragmentHTML = "<span class='colOptions'>";

		fragmentHTML += 
			"<select class='latlong-select'>" + 
			"<option value='lat'>Latitude</option>" + 
			"<option value='long'>Longitude</option>" +
			"<option value='northing'>Northing</option>" + 
			"<option value='easting'>Easting</option>" + 
			"</select>";	

		fragmentHTML += "</span>";
		/*
		 * Add the "fragments" class to the list of columns so CSS styles can 
		 * be applied.
		 */
		columnList.addClass("fragments");
		break;
	default :
		break;
	}

	return fragmentHTML;

}


/*
 * 
 */
$(document).ready(function() {

	/*
	 * Interval set to check when the ui.typingPanelDiv HTML element is created
	 * and bound to the ui object.
	 */
	var interval = setInterval(function () {
		// log(typeof ui.typingPanelDiv);
		if (typeof ui.typingPanelDiv == 'undefined') {
			log("ui.typingPanelDiv is undefined.")
		} else {

			ui.typingPanel = new TypingPanel(ui.typingPanelDiv);

			ui.leftPanelTabs.unbind('tabsshow');
			ui.leftPanelTabs.bind('tabsshow', function (event, tabs) {
				if (tabs.index === 0) {
					ui.browsingEngine.resize();
				} else if (tabs.index === 1) {
					ui.typingPanel.resize();
				} else if (tabs.index === 2) {
					ui.historyPanel.resize();
				}
			});

			$("div#left-panel div.refine-tabs").tabs('select', 1);
			$("div#left-panel div.refine-tabs").css("visibility", "visible");			

			clearInterval(interval);
		}

	}, 5);


	/*
	 * Interaction when clicking on a wizard header
	 */
	$('a.wizard-header').live("click",function() {
		ui.typingPanel.enterWizard($(this).attr("rel"));
	});

	$("div.cancel-button a.button").live("click",function(){
		ui.typingPanel.destroyColumnSelector();
		ui.typingPanel.exitWizard();
	});

	$("div.next-button a.button").live("click",function(){
		ui.typingPanel.destroyColumnSelector();
		ui.typingPanel.enterDescriptionPanel();
	});

	$("p.description a.ex").live("click",function(){

		if($(this).next().css("display") == "none"){
			$(this).next().css("display","block");
		} else {
			$(this).next().hide();
		}
	});

	/*
	 * Interaction for the column selector button. 
	 * 
	 * Slight differences with how the select input is displayed 
	 * depends on what type of "mode" is passed as a parameter.
	 * 
	 * Modes:
	 * default - produces column list with select inputs for fragments
	 * splitter - produces a single column with no select inputs for fragments
	 * single-column - only allows the user to select one column
	 * 
	 */
	$("div.selector a.selectColumn").live("click",function () {

		if($(this).hasClass("splitter")){
			ui.typingPanel.buttonSelector($(this),"splitter");			
		} else if($(this).hasClass("single-column")){ 
			ui.typingPanel.buttonSelector($(this),"single-column");
		} else {
			ui.typingPanel.buttonSelector($(this),"default");			
		}
	});

	/*
	 * "Split address" checkbox
	 */
	$('div.wizard-body input.split').live("change",function(){
		if($(this).attr("checked")){
			$(this).parent().children("div.split").slideDown();
		} else {
			$(this).parent().children("div.split").slideUp();
		}
	});

	/*
	 * Interaction for "split" button in address wizard.
	 */
	$("div.split a.splitter-split").live("click",function(){
		var name = $(this).parent().find("ul.selected-columns").children("li").eq(0).children("span.col").html();
		var separator = $(this).parent().find("input.splitCharacter").val();
		var splitElement = $(this).parent();
		if(separator.length < 1 || name.length < 1){
			alert("You need to make sure you have selected a column to split and entered a character to split by.");
		} else {
			LinkedGov.splitVariablePartColumn.initialise(name,separator,splitElement,function(){
				$("input#address-split").removeAttr("checked");
				$("div.split").hide();
			});
		}
	});

	/*
	 * Interaction for the column range select inputs
	 */
	$("div.selector div.range select").live("change",function () {
		ui.typingPanel.rangeSelector($(this));
	});


	/*
	 * 'Remove column' interaction for column lists
	 */
	$("ul.selected-columns li span.remove").live("click",function(){
		ui.typingPanel.removeColumn($(this));
	});

	/*
	 * Date/time interaction for column lists
	 */
	$("ul.date-checkboxes span.dateFrags input[type='checkbox']").live("change",function(){

		/*
		 * Construct a date fragment string: e.g. Y-D-M-h
		 */
		var dateString = "";
		$.each($(this).parent("span").children("input"),function(){
			if($(this).attr("checked")){
				dateString += $(this).val()+"-";
			}
		});
		dateString = dateString.substring(0,dateString.length-1);
		//log(dateString);

		if(dateString.length > 0) {
			$(this).parent("span").parent("li").children("span.duration").data("olddisplay","block");
			$(this).parent("span").parent("li").children("span.duration").slideDown(250);
		} else {
			$(this).parent("span").parent("li").children("span.duration").slideUp(250);
		}

		/*
		 * Detect day and month selection
		 */
		if(dateString.indexOf("M-D") >= 0){
			//alert("day and month selected");

			// Display input to specify day-month order
			$(this).parent("span").parent("li").children("span.mb4d").data("olddisplay","block");
			$(this).parent("span").parent("li").children("span.mb4d").slideDown(250);

			if(dateString.indexOf("Y") < 0){
				// Display the year input
				$(this).parent("span").parent("li").children("span.year").data("olddisplay","block");
				$(this).parent("span").parent("li").children("span.year").slideDown(250);
			} else {
				$(this).parent("span").parent("li").children("span.year").slideUp(250);
			}
		} else {
			$(this).parent("span").parent("li").children("span.mb4d").slideUp(250);
			$(this).parent("span").parent("li").children("span.year").slideUp(250);
		}

		/*
		 * Detect hour and minute selection
		 */
		if(dateString.indexOf("h-m") >= 0){
			//alert("hours and minutes selected");
			if(dateString.indexOf("D") < 0){
				$(this).parent("span").parent("li").children("span.day").find("input.datepicker").datepicker("destroy").datepicker({
					changeYear:true,
					changeMonth:true,
					dateFormat: 'dd/mm/yy'
				});
				$(this).parent("span").parent("li").children("span.day").data("olddisplay","block");
				$(this).parent("span").parent("li").children("span.day").slideDown(250);
			} else {
				$(this).parent("span").parent("li").children("span.day").slideUp(250);
			}
		} else {
			$(this).parent("span").parent("li").children("span.day").slideUp(250);
		}

	});

	/*
	 * Detect date duration selection
	 */
	$("ul.date-checkboxes input.duration").live("change",function(){
		if($(this).attr("checked")){
			$(this).parent("span").parent("li").children("span.duration").find("div.duration-input").data("olddisplay","block");
			$(this).parent("span").parent("li").children("span.duration").find("div.duration-input").slideDown(250);				
		} else {
			$(this).parent("span").parent("li").children("span.duration").find("div.duration-input").slideUp(250);
		}
	});

	/*
	 * Interaction for address column options
	 */
	$("ul.address-checkboxes span.colOptions select").live("change",function(){
		if($(this).val() == "mixed"){
			$(this).parent("span").parent("li").find("span.postcode").data("olddisplay","block");
			$(this).parent("span").parent("li").find("span.postcode").slideDown(250);
		} else {
			$(this).parent("span").parent("li").find("span.postcode").slideUp(250);
		}
	});


	/*
	 * Show tooltips
	 */
	$("a.info").live("mouseover",function () {
		$(this).next("span").show();
	}).live("mouseout",function () {
		$(this).next("span").hide();
	});



});