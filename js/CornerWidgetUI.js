/************************************************
 *  Lucep's CornerWidgetUI - An extension to the 
 *  Lucep service that provides an inbound lead form
 *  for websites (free for commercial or non-commercial use)
 *  https://github.com/lucep/CornerWidgetUI
 * 
 *  Copyright (C) 2015 - 2016 Lucep Pte Ltd 
 *  Contributors: 
 *    - Kaiesh Vohra (@kaiesh - https://github.com/kaiesh)
 *    - Sathyanarayan Ravi (https://github.com/Atilla14)
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 *************************************************/

CornerWidgetUI = {};

CornerWidgetUI.constants = {
	SESSION_WINDOW: 15 * 60 * 1000, //15 mins

	//IDs for the DOM containers
	_uivar_widgetID : "gorillaWidget",
	_uivar_barID : "gorillaBar",
	_uivar_barTxtID: "gorillaBarTxt",
	_uivar_boxID : "gorillaBox", 
	_uivar_pulseID : "gorillaPulse",
	_uivar_formdataID : "gorillaForm",
	_uivar_botholder: "gorillaBT",
	_uivar_kill : "gorillaEnd",
	_uivar_xboxID: "gorillaX",

	//IDs for the form elements
	_uivar_leadnameID: "gorillaFormName",
	_uivar_leadtelID: "gorillaFormTel",
	_uivar_leadserviceID: "gorillaFormService",
	_uivar_sendleadID: "gorillaFormContact",
	_uivar_formlabelID: "gorillaLabel",
	_uivar_controlfield1: "gorillaCtrl1",
	_uivar_controlfield2: "gorillaCtrl2",

	//Control values
	_formval_placeholder2: "gorillaControlVal",
	_uivar_supported_themes: [
		"default",
		"modern"
	]
};

//Method to simply flatten the tree to determine options for display
CornerWidgetUI.menu_tree = function ( nodes, langcode ) {
	var menu_ml = "";
	for (var i=0; i < nodes.length; i++){
		if ( Object.prototype.toString.call(nodes[i]["children"]) === '[object Array]' && nodes[i]["children"].length > 0 )
			menu_ml += CornerWidgetUI.menu_tree(nodes[i]["children"], langcode);
		else
			menu_ml += "<option value='" + nodes[i]["service_id"] + "'>" + nodes[i]["lt"][langcode] + "</option>";
	}
	return menu_ml;
};

//dynamic object creation method to allow for older browsers that do not comply with the ES6 dynamic object notation
CornerWidgetUI._dyn_obj = function(params){
	var dyn_obj = {};
	for (var i=0; i < params.length; i++){
		dyn_obj[params[i].key] = params[i].value;
	}
	return dyn_obj;
};

CornerWidgetUI.init = function (opts){
	//depends on $lucep being loaded
	$lucep["get_kiosk_details"](
		{
			callback: function (resp){
				//reference the config node:
				if (resp["menu"] && resp["menu"]["config"])
					w_conf = resp["menu"]["config"];
				else
					w_conf = {};

				//Store the server config for this kiosk in memory
				CornerWidgetUI._ui_config = resp;
				
				CornerWidgetUI._calculate_zIndex();
				CornerWidgetUI._ui_config._cdn = _gorilla && _gorilla.cdn ? _gorilla.cdn : "https://8d69a4badb4c0e3cd487-efd95a2de0a33cb5b6fcd4ec94d1740c.ssl.cf2.rackcdn.com/";

				//TODO: Get parameters configured server side for kiosk details
				CornerWidgetUI._ui_config.theme = CornerWidgetUI.constants._uivar_supported_themes.indexOf(w_conf["theme"]) >= 0 ? w_conf["theme"] : "default";
				CornerWidgetUI._ui_config.default_lang = w_conf["default_lang"] ? w_conf["default_lang"] : "eng";
				CornerWidgetUI._ui_config.closed_txt = w_conf["closed_txt"] ? w_conf["closed_txt"] : { "eng" : "Click here to get a callback" };
				CornerWidgetUI._ui_config.open_txt = w_conf["open_txt"] ? w_conf["open_txt"] : {"eng" : "Please tell us how to contact you, and we'll give you a call back now" };
				CornerWidgetUI._ui_config.extra_fields = w_conf["extra_fields"] ? w_conf["extra_fields"] : {};
				CornerWidgetUI._ui_config.color = w_conf["color"] ? w_conf["color"] : {"background": "#4067CB"}; //Lucep blue
				CornerWidgetUI._ui_config.url = opts["url"] ? opts["url"] : "default";
				CornerWidgetUI._ui_config.kiosk_id = w_conf["id"] ? w_conf["id"] : "1";
				CornerWidgetUI._ui_config.button_cta = w_conf["button_cta"] ? w_conf["button_cta"] : {"eng": "Call me!"};
				//configurable element to prevent loss of leads due to incorrect validation
				CornerWidgetUI._ui_config.validation = {limit: w_conf["validation_limit"] ? w_conf["validation_limit"] : 1,
														count: 0};
				
				if (w_conf["auto_open"] && w_conf["auto_open"]["min"] && w_conf["auto_open"]["max"])
					CornerWidgetUI._ui_config.auto_open = {min: parseInt(w_conf["auto_open"]["min"]),
														   max: parseInt(w_conf["auto_open"]["max"])};
				else
					CornerWidgetUI._ui_config.auto_open = {min: 8000, max: 13000};
				//select random time between min and max
				CornerWidgetUI._ui_config.auto_open_time = Math.floor(Math.random() * (CornerWidgetUI._ui_config.auto_open.max - CornerWidgetUI._ui_config.auto_open.min)) + CornerWidgetUI._ui_config.auto_open.min;
				CornerWidgetUI._ui_config.auto_open_over_px = w_conf["auto_open_over_px"] ? w_conf["auto_open_over_px"] : 700
				//Configurable element to determine positioning - default to bottom right alignment
				CornerWidgetUI._ui_config.position = w_conf["position"] ? w_conf["position"] : {"align": "right", "vertical-align":"bottom"};

				CornerWidgetUI._ui_config.css = opts["css"] ? (opts["css"]) : (w_conf["css"] ? w_conf["css"] : CornerWidgetUI._ui_config._cdn + "/css/CornerWidgetUI."+ CornerWidgetUI._ui_config.theme +".stable.latest.min.css" );

				//Store the whitelist or blacklist of URL patterns
				CornerWidgetUI._ui_config.restrictions = w_conf["display_restrictions"] ? w_conf["display_restrictions"] : {"mode": "blacklist", "list": []};

				//Prepare the Utils Config for fancy telephone input
				CornerWidgetUI._ui_config.tel_input_prefs = 
					{ "defaultCountry": "auto",
					  "nationalMode": true,
					  "preferredCountries": resp["default_countries"] ? resp["default_countries"] : ["us", "gb", "sg"], 
					  "responsiveDropdown": true,
					  "utilsScript" : CornerWidgetUI._ui_config._cdn + "/intlTelInputv6.0.4/js/telutils.js",
					  "geoIpLookup": function(callback){
						  $lucep["get_geo_data"]({callback: function (resp){
							  var countryCode = (resp && resp.country) ? resp.country : "";
							  callback(countryCode);
						  }});
					  }
					};
				
				//Load the menu tree ML into a var
				CornerWidgetUI._ui_config.menutree = CornerWidgetUI.menu_tree(resp["menu"]["tree"]["children"], CornerWidgetUI._ui_config["default_lang"]);


				//Validate that the current URL is permitted to be displayed from the config list
				var url_match = false;
				for (var i=0; i < CornerWidgetUI._ui_config.restrictions["list"].length; i++){
					try{
						var regex_test = new RegExp(CornerWidgetUI._ui_config.restrictions["list"][i]["pattern"]);
						if (regex_test.test(document.location.href)){
							url_match = true;
							break;
						}
					}catch (e){
						console.log("Unable to enforce regex URL check for: "+CornerWidgetUI._ui_config.restrictions["list"][i]);
					}
				}
				if (url_match && CornerWidgetUI._ui_config.restrictions["mode"]=="blacklist")
					return; //blacklisted URL, do not proceed with display
				else if (!url_match && CornerWidgetUI._ui_config.restrictions["mode"]=="whitelist")
					return; //whitelist mode, but URL not allowed, do not proceed with display

				var css_file = document.createElement("link");
				css_file.rel = "stylesheet";
				css_file.media = "screen";
				css_file.type = "text/css";
				css_file.href = CornerWidgetUI._ui_config.css,
				css_file.onload = function(){
					CornerWidgetUI._load_libraries(opts);
				};
				//attach the CSS file so the UI can load
				CornerWidgetUI._attach_css(css_file);
			}
		}
	);
};

CornerWidgetUI._within_session = function (opts){
	var within_time = false;
	if ( $lucep["get_data"]( {"key": "gorilla-last-launch"} ) &&
		 ( $lucep["get_data"]( {"key": "gorilla-last-launch"} ) + CornerWidgetUI.constants.SESSION_WINDOW > ( new Date() ).getTime() ) ) {
		//the widget was last launched in less than the specified window - store true as the return value
		within_time = true;
	}

	//Update/store the information about this interaction
	if ( opts )
		$lucep["put_data"]( {"key": "gorilla-last-launch", "value": ( new Date() ).getTime()} );

	return within_time;

};

CornerWidgetUI._attach_css = function (css_file){
	if ( document.body != null )
		document.body.appendChild( css_file );
	else
		setTimeout(function(){
			CornerWidgetUI._attach_css( css_file );
		}, 250);
};

CornerWidgetUI._load_libraries = function(opts){
	//This UI also requires jQuery and some plugins, so download those in parallel
	var jquerylib = opts["jquery"] ? opts["jquery"] : "https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js";
	var intlTelInput_js = opts["intlTelInput_js"] ? opts["intlTelInput_js"] : CornerWidgetUI._ui_config._cdn + "/intlTelInputv6.0.4/js/intlTelInput.min.js";
	var intlTelInput_css = opts["intlTelInput_css"] ? opts["intlTelInput_css"] : CornerWidgetUI._ui_config._cdn + "/intlTelInputv6.0.4/css/intlTelInput.css";
	
	var _load_fancy_telephone_dom = function (opts) {

		CornerWidgetUI._draw_ui(opts);

		CornerWidgetUI.jQuery( "#"+CornerWidgetUI.constants._uivar_leadtelID ).intlTelInput( CornerWidgetUI._ui_config.tel_input_prefs ).done(function() {
		})
			//the field has been upgraded, store this fact
			CornerWidgetUI._f_set = true;
			CornerWidgetUI._bind_events(opts);
			CornerWidgetUI.control( { state: "new" } );


	};

	var _load_fancy_telephone_css = function(opts) {
		$lucep.add( { href: intlTelInput_css,
				  rel: "stylesheet",
				  type: "text/css" },
				function(){	
				},
				"head",
				"link",
				0);
	}	

	var _load_fancy_telephone_js = function(opts) {
		$lucep.add( { src: intlTelInput_js,
						type: "text/javascript" },
				function (){
					_load_fancy_telephone_dom(opts)
					
				},
			"head",
			"script",
			0 );
	}

	var _load_jquery = function(opts) {

		_load_fancy_telephone_css(opts)
		//add jQuery if it does not exist or has unsupported version
		if (!window.jQuery || (parseInt(window.jQuery.fn.jquery.split('.')[0]) < 1 || (parseInt(window.jQuery.fn.jquery.split('.')[0]) === 1 && parseInt(window.jQuery.fn.jquery.split('.')[1]) < 5) || parseInt(window.jQuery.fn.jquery.split('.')[0]) >= 3)) {
			if (window.jQuery) CornerWidgetUI._f_jquery = true;
			else CornerWidgetUI._f_jquery = false;
			$lucep.add( { src:  jquerylib, type: ""},
						function (){
							if (CornerWidgetUI._f_jquery) {
								CornerWidgetUI.jQuery = jQuery.noConflict(true);
								CornerWidgetUI.$ = CornerWidgetUI.jQuery;
							} else {
								CornerWidgetUI.jQuery = window.jQuery;
								CornerWidgetUI.$ = CornerWidgetUI.jQuery;
							}
							CornerWidgetUI._ui_config.tel_input_prefs.jQuery = CornerWidgetUI.jQuery;
							_load_fancy_telephone_js(opts);
						},
						"head",
						"script",
						0 );
		} else {
			CornerWidgetUI.jQuery = window.jQuery;
			CornerWidgetUI.$ = CornerWidgetUI.jQuery;
			_load_fancy_telephone_js(opts);
		}
	}

	// Load the utilsScript first, due the loading issues of the telutils
	$lucep.add({
		src: CornerWidgetUI._ui_config._cdn + "/intlTelInputv6.0.4/js/telutils.js",
		type: "text/javascript"
	}, function() {
		if (!CornerWidgetUI._f_load) {
			_load_jquery(opts)
			CornerWidgetUI._f_load = true;
		}
		CornerWidgetUI._f_utils = true;
	},
	"head",
	"script", 0)

	// If utils doesnt load for 3 seconds then still load the widget
	setTimeout(function() {
		if (!CornerWidgetUI._f_load) {
			_load_jquery(opts)
			CornerWidgetUI._f_load = true;
		}	
	}, 3000)
};

CornerWidgetUI._declare_bar_length = function(){
	//If the DOM elements are available, then proceed with the class changes and width management
	if (CornerWidgetUI._cssLoad){
		if (!CornerWidgetUI._bar_length)
			CornerWidgetUI._bar_length = document.getElementById(CornerWidgetUI.constants._uivar_barTxtID).clientWidth;
		CornerWidgetUI._manage_styles( {"elem": document.getElementById(CornerWidgetUI.constants._uivar_barID),
									  "style": {"width": CornerWidgetUI._bar_length+"px"} });
	}else{
		//inform the upcoming functions that the CSS will likely be loaded by this point
		CornerWidgetUI._cssLoad = true;
	}
};

CornerWidgetUI._calculate_zIndex = function() {
	var nodes = document.getElementsByTagName("*");
	var maxZ = 1;
	for (var i = 0; i < nodes.length; i++) {
	    maxZ = maxZ > (getComputedStyle(nodes[i]).zIndex !== "auto" ? parseInt(getComputedStyle(nodes[i]).zIndex) : 1) ? maxZ : (getComputedStyle(nodes[i]).zIndex !== "auto" ? parseInt(getComputedStyle(nodes[i]).zIndex) : 1)
	}
	CornerWidgetUI._ui_config.zIndex = maxZ + 1000 > 31760 ? 31760 : maxZ + 1000;
}

CornerWidgetUI._draw_ui = function (){

	//Define the widget components and begin display rendering
	var _ui_widget_btn = document.createElement( "DIV" );
	_ui_widget_btn.id = CornerWidgetUI.constants._uivar_widgetID;

	var _ui_widget_bar = document.createElement( "DIV" );
	_ui_widget_bar.id = CornerWidgetUI.constants._uivar_barID;
	_ui_widget_bar.className = "a-gorilla-loading";

	var _ui_widget_x = document.createElement( "DIV" );
	_ui_widget_x.id = CornerWidgetUI.constants._uivar_xboxID;
	_ui_widget_x.className = "a-gorilla-loading";

	//if the widget has been recently loaded, then avoid animations on page load
	if ( CornerWidgetUI._within_session() ){
		_ui_widget_btn.className = "";
			_ui_widget_x.className = "";
	}else{
		_ui_widget_btn.className = "a-gorilla-loading";
		_ui_widget_x.className = "a-gorilla-loading";
	}
	
	var _ui_widget_box = document.createElement( "DIV" );
	_ui_widget_box.id =	CornerWidgetUI.constants._uivar_boxID;
	
	var _ui_pulse = document.createElement( "DIV" );
	_ui_pulse.id = CornerWidgetUI.constants._uivar_pulseID;

	//Add the components to the body
	if ( document.body != null ) {
		document.body.appendChild( _ui_widget_btn );
		document.body.appendChild( _ui_widget_bar );
		document.body.appendChild( _ui_widget_x );
		document.body.appendChild( _ui_widget_box );
		document.body.appendChild( _ui_pulse );
	}
	
	//Attach references to the DOM elements to the JS for ease of access
	CornerWidgetUI.elem_widget_btn = document.getElementById( CornerWidgetUI.constants._uivar_widgetID );
	CornerWidgetUI.elem_widget_bar = document.getElementById( CornerWidgetUI.constants._uivar_barID );
	CornerWidgetUI.elem_widget_x = document.getElementById( CornerWidgetUI.constants._uivar_xboxID );
	CornerWidgetUI.elem_widget_box = document.getElementById( CornerWidgetUI.constants._uivar_boxID );
	CornerWidgetUI.elem_pulse = document.getElementById( CornerWidgetUI.constants._uivar_pulseID );

	CornerWidgetUI._declare_bar_length();
	
	//draw the form
	var _ui_form = document.createElement( "DIV" );
	_ui_form.id = CornerWidgetUI.constants._uivar_formdataID;
	CornerWidgetUI.elem_widget_box.appendChild( _ui_form );
	
	//TODO: add iterator for custom fields
	
	//build the form
	var prev_name = "", prev_tel = "";
	if ( $lucep["get_data"]( {"key": "name"} ) )
		prev_name = $lucep["get_data"]( {"key": "name"} );
	if ( $lucep["get_data"]( {"key": "tel"} ) )
		prev_tel = $lucep["get_data"]( {"key": "tel"} );
	
	var form_elem = document.getElementById( CornerWidgetUI.constants._uivar_formdataID );
	form_elem.innerHTML = CornerWidgetUI._ui_config["open_txt"][CornerWidgetUI._ui_config["default_lang"]] + "<input type='text' id='" + CornerWidgetUI.constants._uivar_leadnameID + "' placeholder ='Your Name' value='" + prev_name + "' /><input type='tel' id='" + CornerWidgetUI.constants._uivar_leadtelID +"'/><select id='" + CornerWidgetUI.constants._uivar_leadserviceID + "'>" + CornerWidgetUI._ui_config.menutree + "</select><div id='"+CornerWidgetUI.constants._uivar_botholder+"'><input type='text' id='" + CornerWidgetUI.constants._uivar_controlfield1 + "' placeholder='Your input' /><input type='text' id='" + CornerWidgetUI.constants._uivar_controlfield2 + "' placeholder='Your input' value='" + CornerWidgetUI.constants._formval_placeholder2 +"' /><button id='" + CornerWidgetUI.constants._uivar_kill + "'>Done</button></div><button id='" + CornerWidgetUI.constants._uivar_sendleadID  + "'>Call me!</button><span id='" + CornerWidgetUI.constants._uivar_formlabelID  + "' ><a href='https://www.lucep.com/?ref=" + document.URL + "&s=" + CornerWidgetUI._ui_config.url + "&k=" + CornerWidgetUI._ui_config.kiosk_id + "&l=" + CornerWidgetUI._ui_config.default_lang +"' target='_blank' >Powered by Lucep</a></span>";
	CornerWidgetUI.elem_formdata = form_elem;
	
	//add the text to the bar
	CornerWidgetUI.elem_widget_bar.innerHTML = "<span id='gorillaBarTxt'>"+CornerWidgetUI._ui_config["closed_txt"][CornerWidgetUI._ui_config["default_lang"]]+"</span>";
	
	//add the X to the x-box
	CornerWidgetUI.elem_widget_x.innerHTML = "X";

	//if there is some actual content in the telephone number then populate it
	if (prev_tel != "")
		document["getElementById"](CornerWidgetUI.constants._uivar_leadtelID)["value"] = prev_tel;

	CornerWidgetUI._add_custom_color();
	CornerWidgetUI._set_zIndex();
};

CornerWidgetUI._add_custom_color = function () {
	document.getElementById(CornerWidgetUI.constants._uivar_widgetID).style.backgroundColor = CornerWidgetUI._ui_config.color.background;
	document.getElementById(CornerWidgetUI.constants._uivar_boxID).style.borderColor = CornerWidgetUI._ui_config.color.background;
	document.getElementById(CornerWidgetUI.constants._uivar_xboxID).style.borderColor = CornerWidgetUI._ui_config.color.background;
	for (var i = 0; i < document.getElementById(CornerWidgetUI.constants._uivar_formdataID).children.length; i++) {
		document.getElementById(CornerWidgetUI.constants._uivar_formdataID).children[i].style.borderColor = CornerWidgetUI._ui_config.color.background;
	}
	document.getElementById(CornerWidgetUI.constants._uivar_leadtelID).style.borderColor = CornerWidgetUI._ui_config.color.background;
	document.getElementById(CornerWidgetUI.constants._uivar_barID).style.borderColor = CornerWidgetUI._ui_config.color.background;
};

CornerWidgetUI._set_zIndex = function() {
	CornerWidgetUI.elem_widget_btn.style.zIndex = (CornerWidgetUI._ui_config.zIndex + 4);
	CornerWidgetUI.elem_widget_x.style.zIndex = CornerWidgetUI._ui_config.zIndex + 3;
	CornerWidgetUI.elem_widget_bar.style.zIndex = CornerWidgetUI._ui_config.zIndex + 1;
	CornerWidgetUI.elem_widget_box.style.zIndex = CornerWidgetUI._ui_config.zIndex + 2;
	CornerWidgetUI.elem_pulse.style.zIndex = CornerWidgetUI._ui_config.zIndex;
}

CornerWidgetUI._bind_events = function (opts){


	//Attach the click handler that kills the submission capability (anti-spambot measure)
	document["getElementById"](CornerWidgetUI.constants._uivar_kill).addEventListener("click", function(e){
		CornerWidgetUI._block = true;
	});

	//Attach click/touch handlers that fire messages into the UI Control for widget open/close
	CornerWidgetUI.elem_widget_btn.addEventListener( "click", function( e ) {
		//capture the event, add support for older browsers
		var event = e || window.event;
		if (! window.intlTelInputUtils){
			//If the utils have not loaded, try to load them (insurance!)
			CornerWidgetUI.jQuery("#"+CornerWidgetUI.constants._uivar_leadtelID).intlTelInput("loadUtils", CornerWidgetUI._ui_config.tel_input_prefs["utilsScript"] );
		}

		//fire the UI control function
		CornerWidgetUI.control( { state: "clicked_icon",
								  event: event,
								  elem: this } );
	} );
	CornerWidgetUI.elem_widget_x.addEventListener( "click", function( e ) {
		//capture the event, add support for older browsers
		var event = e || window.event;
		if (!window.intlTelInputUtils){
			//If the utils have not loaded, try to load them (insurance!)
			CornerWidgetUI.jQuery.fn.intlTelInput("loadUtils",CornerWidgetUI._ui_config.tel_input_prefs["utilsScript"] );
		}

		//fire the UI control function
		CornerWidgetUI.control( { state: "clicked_x",
								  event: event,
								  elem: this } );
	} );
	//Do the same for the text bar
	CornerWidgetUI.elem_widget_bar.addEventListener( "click", function( e ) {
		//capture the event, add support for older browsers
		var event = e || window.event;
		if (! window.intlTelInputUtils){
			//If the utils have not loaded, try to load them (insurance!)
			CornerWidgetUI.jQuery("#"+CornerWidgetUI.constants._uivar_leadtelID).intlTelInput("loadUtils", CornerWidgetUI._ui_config.tel_input_prefs["utilsScript"] );
		}

		//fire the UI control function
		CornerWidgetUI.control( { state: "clicked_icon",
								  event: event,
								  elem: this } );
	} );

	//store the reference to the sendlead button, and other form elements
	CornerWidgetUI.elem_sendlead_btn = document.getElementById( CornerWidgetUI.constants._uivar_sendleadID );
	CornerWidgetUI.elem_field_name = document.getElementById( CornerWidgetUI.constants._uivar_leadnameID );
	CornerWidgetUI.elem_field_tel = document.getElementById( CornerWidgetUI.constants._uivar_leadtelID );
	CornerWidgetUI.elem_field_service = document.getElementById( CornerWidgetUI.constants._uivar_leadserviceID );
				
	//Number validation is an important benefit of this widget, and also for the user experience, make sure there are multiple ways it can be validated/checked
	CornerWidgetUI.elem_field_tel.addEventListener( "change", function (e){
		
	});
				
	//Attach click handler to submit button
	CornerWidgetUI.elem_sendlead_btn.addEventListener( "click", function ( e ) {
		//capture the event, add support for older browsers
		var event = e || window.event;
		CornerWidgetUI._raise_lead(this);
	});

};

CornerWidgetUI._manage_styles = function (params){
	if (params["reset"]){
		//reset this element for the listed properties in this array
		var setAttr = "";
		for (var i=0; i < params["reset"]["length"]; i++){
			if (setAttr != "")
				setAttr += ";";
			setAttr += params["reset"][i] + ":''";
			params["elem"]["style"][params["reset"][i]] = "";
		}
		params["elem"]["setAttribute"]("style", setAttr);
	}
	if (params["style"]){
		//iterate through the style keys to apply the CSS
		var setAttr = "";
		for (var style_prop in params["style"]){
			if (params["style"]["hasOwnProperty"](style_prop)){
				if (setAttr != "")
					setAttr += ";"
				setAttr += style_prop+":"+params["style"][style_prop];

				params["elem"]["style"][style_prop] = params["style"][style_prop];
			}
		}
		params["elem"]["setAttribute"]("style", setAttr);
	}
	

	params["elem"]["className"] = params["className"] ? params["className"] : "";
};

CornerWidgetUI.control = function (params){
	switch ( params.state ) {
	case 'raised_lead':
		
		//Start by removing any custom styles
		CornerWidgetUI._manage_styles({ elem: CornerWidgetUI.elem_widget_btn,
										reset: [CornerWidgetUI._ui_config.position["vertical-align"], CornerWidgetUI._ui_config.position["align"]],
										className: "a-gorilla-aboutToWait" });
		CornerWidgetUI._manage_styles({ elem: CornerWidgetUI.elem_widget_x,
										reset: [CornerWidgetUI._ui_config.position["vertical-align"], 
												CornerWidgetUI._ui_config.position["align"]] });
		CornerWidgetUI._manage_styles({ elem: CornerWidgetUI.elem_widget_box,
										reset: "height"});
		CornerWidgetUI._manage_styles({ elem: CornerWidgetUI.elem_widget_bar });
		CornerWidgetUI._declare_bar_length();

		CornerWidgetUI.elem_sendlead_btn.innerHTML = "Waiting for callback";

		//once the transition has completed, start the animation
		setTimeout(function(){
			CornerWidgetUI.elem_widget_btn.className="a-gorilla-waiting";
		},1100);

		if ( CornerWidgetUI._prev_state != "raised_lead" ) {

			//disable all form elements
			CornerWidgetUI.elem_field_name.disabled = true;
			CornerWidgetUI.elem_field_tel.disabled = true;
			CornerWidgetUI.elem_field_service.disabled = true;
			CornerWidgetUI.elem_sendlead_btn.disabled = true;

			$lucep["send_intelligence"]( { event_type: "auto-shrink",
											 payload: { country: CornerWidgetUI.jQuery( ".selected-flag" )["attr"]( "title" ) }
										   } ); //depends on fancy telephone being loaded

		}
		CornerWidgetUI._prev_state = CornerWidgetUI._curr_state;
		CornerWidgetUI._curr_state = "raised_lead";

		//set the default state to closed
		$lucep.put_data({"key": "lucep-state", "value": "closed"});

		break;

	case 'auto_open':
	case 'tapped_icon':
	case 'clicked_icon':
	case 'clicked_x':
		//toggle visibility
		if ( CornerWidgetUI.elem_widget_btn.className == "a-gorilla-clicked" && params.state != 'auto_open' ) {
			//remove any custom styles applied by previous clicks
			CornerWidgetUI._manage_styles({ elem: CornerWidgetUI.elem_widget_btn,
											reset: [CornerWidgetUI._ui_config.position["vertical-align"], 
													CornerWidgetUI._ui_config.position["align"]] });
			CornerWidgetUI._manage_styles({ elem: CornerWidgetUI.elem_widget_x,
											reset: [CornerWidgetUI._ui_config.position["vertical-align"], 
													CornerWidgetUI._ui_config.position["align"]] });
			CornerWidgetUI._manage_styles({ elem: CornerWidgetUI.elem_widget_box,
											reset: ["height"]});
			CornerWidgetUI._manage_styles({ elem: CornerWidgetUI.elem_widget_bar,
											reset: [CornerWidgetUI._ui_config.position["vertical-align"], 
													CornerWidgetUI._ui_config.position["align"]]});
			CornerWidgetUI._declare_bar_length();
			
			//ensure state is restored properly
			if ( CornerWidgetUI._prev_state == "new" || CornerWidgetUI._prev_state == "closed" || CornerWidgetUI._prev_state == "open" ) {
				//regular behaviour
				CornerWidgetUI.elem_widget_btn.className = "";
				CornerWidgetUI.elem_widget_box.className = "";
				CornerWidgetUI.elem_widget_x.className = "";
				CornerWidgetUI.elem_widget_bar.className = "";

				//Update state
				CornerWidgetUI._prev_state = CornerWidgetUI._curr_state;
				CornerWidgetUI._curr_state = "closed";
			} else if ( CornerWidgetUI._prev_state == "in_call" ) {
				//set the button
				CornerWidgetUI.elem_widget_btn.className="a-gorilla-incall";
				//shrink the box
				CornerWidgetUI.elem_widget_box.className = "";
				CornerWidgetUI.elem_widget_bar.className = "";

				CornerWidgetUI._prev_state = CornerWidgetUI._curr_state;
				CornerWidgetUI._curr_state = "in_call";
			} else if ( CornerWidgetUI._prev_state == "raised_lead" ) {
				//Move state to prepare for waiting
				CornerWidgetUI.elem_widget_btn.className = "a-gorilla-aboutToWait";
				CornerWidgetUI.elem_widget_box.className = "";
				CornerWidgetUI.elem_widget_bar.className = "";

				CornerWidgetUI.elem_sendlead_btn.innerHTML = "Waiting for callback";

				//once the transition has completed, start the animation
				setTimeout(function(){
					CornerWidgetUI.elem_widget_btn.className="a-gorilla-waiting";
				},1100);

				CornerWidgetUI._prev_state = CornerWidgetUI._curr_state;
				CornerWidgetUI._curr_state = "raised_lead";
			}

			//track event
			//TODO: Fix dependency on fancy telephone
			$lucep["send_intelligence"]( { event_type: "close-prompt",
										   payload: {"location": CornerWidgetUI.jQuery( ".selected-flag" )["attr"]( "title" ) } } ); //depends on fancy telephone being loaded
			$lucep.put_data({"key": "lucep-state", "value": "closed"});
		} else if ( CornerWidgetUI.elem_widget_btn.className != "a-gorilla-clicked" ){ 

			//capture properties related to the size of the form and apply them to the box and button
			CornerWidgetUI._manage_styles({"elem": CornerWidgetUI.elem_widget_btn,
										   "style": CornerWidgetUI._dyn_obj([{key: CornerWidgetUI._ui_config.position["vertical-align"], value: (CornerWidgetUI.elem_formdata.clientHeight + 13 + 20)+"px"},
																			{key: CornerWidgetUI._ui_config.position["align"], value: (CornerWidgetUI.elem_formdata.clientWidth+20)+"px"}]),
										   "className": "a-gorilla-clicked" });

			CornerWidgetUI._manage_styles({"elem": CornerWidgetUI.elem_widget_x,
										   "style": CornerWidgetUI._dyn_obj([{key: CornerWidgetUI._ui_config.position["vertical-align"], 
																			  value: (CornerWidgetUI.elem_formdata.clientHeight + 13 + 30)+"px"},
																			{key: CornerWidgetUI._ui_config.position["align"], 
																			 value: "5px"}]),
										   "className": "a-gorilla-clicked" });


			CornerWidgetUI._manage_styles({"elem": CornerWidgetUI.elem_widget_box,
										   "style": {"height": (CornerWidgetUI.elem_formdata.clientHeight + 13)+"px",
													 "width":  (CornerWidgetUI.elem_formdata.clientWidth)+"px"},
										   "className": "a-gorilla-open"});

			CornerWidgetUI._manage_styles({"elem": CornerWidgetUI.elem_widget_bar,
										   "style": CornerWidgetUI._dyn_obj([{key: CornerWidgetUI._ui_config.position["vertical-align"], value: (CornerWidgetUI.elem_formdata.clientHeight + 13 + 20 + 10)+"px"},
													 {key: CornerWidgetUI._ui_config.position["align"], value: (CornerWidgetUI.elem_formdata.clientWidth+20+20)+"px"}]),
										   "className": "a-gorilla-open"});

			setTimeout( function() {
				//CornerWidgetUI.elem_widget_box.setAttribute("style", "overflow:visible");
				CornerWidgetUI.elem_widget_box.style.overflow = "visible";
			}, 1000 );

			var intel_obj = {
				event_type: params.state,
				payload: {
					"location": CornerWidgetUI.jQuery(".selected-flag")["attr"]("title")
				}
			}
			if (params.state === "auto_open") intel_obj.payload["auto_open_time"] = (CornerWidgetUI._ui_config.auto_open_time/1000);
			//track event
			$lucep["send_intelligence"]( intel_obj ); //depends on fancy telephone being loaded

			//update state
			CornerWidgetUI._prev_state = CornerWidgetUI._curr_state;
			CornerWidgetUI._curr_state = "open";
			$lucep.put_data({"key": "lucep-state", "value": "open"});
		}
		break;

	case 'in_call':
		if ( CornerWidgetUI._curr_state != "in_call" && CornerWidgetUI._curr_state != "open" ) {
			CornerWidgetUI.elem_widget_btn.className="a-gorilla-aboutToWait";
			setTimeout(function(){
				CornerWidgetUI.elem_widget_btn.className="a-gorilla-incall";
			},500);

			//update state
			CornerWidgetUI._prev_state = CornerWidgetUI._curr_state;
			CornerWidgetUI._curr_state = params.state;
		} else {
			//for use when restoring state
			CornerWidgetUI._prev_state = "in_call";
		}
		//disable all form elements
		CornerWidgetUI.elem_field_name.disabled = true;
		CornerWidgetUI.elem_field_tel.disabled = true;
		CornerWidgetUI.elem_field_service.disabled = true;
		CornerWidgetUI.elem_sendlead_btn.disabled = true;
		CornerWidgetUI.elem_sendlead_btn.innerHTML = "Currently in call";
		break;

	case 'new':
		//TODO: Minimise, and present a clean box
		if ( typeof CornerWidgetUI._prev_state == 'undefined' || CornerWidgetUI._prev_state == null ) {
			//no history recorded in this instance, but check to see if it has recently been launched
			//if the widget has been recently loaded, then avoid animations on page load
			if ( CornerWidgetUI._within_session( true ) ) {
				//the widget was last launched within the session window - simply display it immediately
				CornerWidgetUI.elem_widget_btn.className = "";
				CornerWidgetUI.elem_widget_box.className = "";
				CornerWidgetUI.elem_widget_bar.className = "";

				CornerWidgetUI._declare_bar_length();

			} else {
				setTimeout( function() {
					CornerWidgetUI.elem_widget_btn.className = "";
					CornerWidgetUI.elem_widget_box.className = "";

					CornerWidgetUI._declare_bar_length();

					CornerWidgetUI.elem_pulse.className = "emit";
					setTimeout( function() {
						CornerWidgetUI.elem_pulse.className = "";
					}, 2100);
				}, 1000);
			}

			//document the state
			CornerWidgetUI._prev_state = params.state;
			CornerWidgetUI._curr_state = params.state;

			//check if auto open is active for fresh page loads, and check previous state
			if (CornerWidgetUI._ui_config.auto_open.min > 0 
				&& (screen ? (screen.width ? screen.width > CornerWidgetUI._ui_config.auto_open_over_px : true) : true) 
				&& (!$lucep["get_data"]({"key": "lucep-state"}) 
					|| $lucep["get_data"]({"key": "lucep-state"}) == "open"
				   )
			   ){
				setTimeout(function(){
					CornerWidgetUI.control({state: "auto_open"});
				}, CornerWidgetUI._ui_config.auto_open_time);
			}

		} else {
			CornerWidgetUI._curr_state = params.state;
			//set the button
			CornerWidgetUI._manage_styles({elem: CornerWidgetUI.elem_widget_btn,
										   reset: [CornerWidgetUI._ui_config.position["vertical-align"], CornerWidgetUI._ui_config.position["align"]]});
			//shrink the box
			CornerWidgetUI._manage_styles({elem: CornerWidgetUI.elem_widget_box,
										   reset: ["height", "overflow", "width"]});

			//restore the text bar
			CornerWidgetUI._manage_styles({elem: CornerWidgetUI.elem_widget_bar,
										   reset: [CornerWidgetUI._ui_config.position["vertical-align"], CornerWidgetUI._ui_config.position["align"]]});
			CornerWidgetUI._declare_bar_length();
		}
		//enable all form elements
		CornerWidgetUI.elem_field_name.disabled = false;
		CornerWidgetUI.elem_field_tel.disabled = false;
		CornerWidgetUI.elem_field_service.disabled = false;
		CornerWidgetUI.elem_sendlead_btn.disabled = false;
		CornerWidgetUI.elem_sendlead_btn.innerHTML = CornerWidgetUI._ui_config["button_cta"][CornerWidgetUI._ui_config["default_lang"]];

		break;
	}

	//FOR ALL CASES
	if ( params.event ) {
		//prevent this click going beyond this handler
		if ( params.event.stopPropagation )
			params.event.stopPropagation();
		else
			params.event.cancelBubble = true;
	}
	CornerWidgetUI._add_custom_color();
	CornerWidgetUI._set_zIndex();
};

CornerWidgetUI._fail_submit = function (elem_id) {
	CornerWidgetUI.jQuery("#"+elem_id).addClass("a-gorilla-error");
	setTimeout(function(){
		CornerWidgetUI.jQuery("#"+elem_id).removeClass("a-gorilla-error");
	},1000);
	CornerWidgetUI._ui_config.validation.count++;
}

CornerWidgetUI._raise_lead = function (btn_ref){
	//Capture the telephone number as a priority - even if we think it may be a bot
	//If the utils have failed to load, the number must be extracted differently
	var tel_no, lead_name, service_id, service_name;
	if ( !window["intlTelInputUtils"] || CornerWidgetUI.jQuery("#"+CornerWidgetUI.constants._uivar_leadtelID)["intlTelInput"]("getNumber") === ""){
		var country_sel = CornerWidgetUI.jQuery(".selected-flag")["attr"]("title");
		var country_code = country_sel.substr(country_sel.indexOf(": +")+2, 5);
		var number = CornerWidgetUI.jQuery("#"+CornerWidgetUI.constants._uivar_leadtelID)["val"]();

		//check if the phone number prefix is already prefixing the number by being at the starting position.
		if (number["indexOf"](country_code) === 0){
			tel_no = number;
		}else{
			tel_no = country_code +""+ number;
		}
	}else{
		tel_no = CornerWidgetUI.jQuery("#"+CornerWidgetUI.constants._uivar_leadtelID)["intlTelInput"]("getNumber");
	}

	//Check if the kill flag has been set (antispam measure 1), and that control fields are not edited (antispam measure 2)
	if (CornerWidgetUI._block === true || document["getElementById"](CornerWidgetUI.constants._uivar_controlfield1).value != '' ||  document["getElementById"](CornerWidgetUI.constants._uivar_controlfield2).value != CornerWidgetUI.constants._formval_placeholder2){
		//Log the bot event in analytics
		$lucep.send_intelligence({event_type: "btslog",
								  payload: {name: CornerWidgetUI.elem_field_name.value,
											tel: tel_no,
											service: CornerWidgetUI.elem_field_service}});
		//load the bot up with garbage
		CornerWidgetUI._b = {};
		setTimeout(function(e){
			for (var i=0; i<100000; i++){
				CornerWidgetUI._b[i] = new Date();
			}
		}, 1000);
		btn_ref.disabled = true;
		return true;
	}

	if (window.intlTelInputUtils) {
		//Limit field validation to preventing submission only X number of times
		if ( (! CornerWidgetUI.jQuery("#"+CornerWidgetUI.constants._uivar_leadtelID).intlTelInput("isValidNumber")) && CornerWidgetUI._ui_config.validation.count < CornerWidgetUI._ui_config.validation.limit) {
			CornerWidgetUI._fail_submit(CornerWidgetUI.constants._uivar_leadtelID)
			$lucep.send_intelligence({event_type: "bad-number-entry",
									  payload: {number: tel_no,
												validationCount: CornerWidgetUI._ui_config.validation.count}});
			return false;
		}
	} else {
		// if tel input validation isn't working then use 
		if (CornerWidgetUI.jQuery("#"+CornerWidgetUI.constants._uivar_leadtelID).val().length < 4) {
			CornerWidgetUI._fail_submit(CornerWidgetUI.constants._uivar_leadtelID)
			$lucep.send_intelligence(
				{
					event_type: "bad-number-entry",
					payload: {
						number: tel_no,
						validationCount: CornerWidgetUI._ui_config.validation.count
					}
				}
			)
			return false;
		}
	}

	// Validate name field
	if (document["getElementById"](CornerWidgetUI.constants._uivar_leadnameID)["value"]["length"] < 2) {
		CornerWidgetUI._fail_submit(CornerWidgetUI.constants._uivar_leadnameID)
		$lucep.send_intelligence(
			{
				event_type: "invalid-name-entry",
				payload: {
					name: document["getElementById"](CornerWidgetUI.constants._uivar_leadserviceID)["value"],
					validationCount: CornerWidgetUI._ui_config.validation.count
				}
			}
		)
		return false;
	}


	lead_name = document["getElementById"](CornerWidgetUI.constants._uivar_leadnameID)["value"];
	service_id = document["getElementById"](CornerWidgetUI.constants._uivar_leadserviceID)["value"];
	service_index = document["getElementById"](CornerWidgetUI.constants._uivar_leadserviceID).selectedIndex;
	CornerWidgetUI._ui_config.validation.count = 0; //reset the validation restriction as the criteria passed
	
	//Store data for future use
	$lucep["put_data"]( {"key": "name", "value": document["getElementById"](CornerWidgetUI.constants._uivar_leadnameID)["value"] } );
	$lucep["put_data"]( {"key": "tel", "value": tel_no } );
	
	var lead_opts = {
		"payload": {},
		"service_id": service_id,
		"service_name": document["getElementById"](CornerWidgetUI.constants._uivar_leadserviceID)[service_index].text,
		"phone_number": tel_no,
		"name": lead_name,
		"callback": function (progress){
			if (!progress["ticket-status"] && progress["server"]===true){
				//there was an error on the server, invite the user to try again
				//TODO: Invite the user to try again
				CornerWidgetUI.control({"state": "new"});
				return;
			}
				//gets notified on the various stages of lead progression/notification
			switch(progress["ticket-status"]){
				case "new":
					CornerWidgetUI.control({"state": "raised_lead"});
					return true; // more updates wanted
					break;

				case "processing":
					CornerWidgetUI.control({"state": "in_call"});
					return true; //more updates wanted
					break;

				case "finished":
					CornerWidgetUI.control({"state": "new"});
					return false; //no more updates wanted on this ticket
					break;

				case "no-ticket":
					CornerWidgetUI.control({"state": "new"});
					return false; //no more updates wanted on this ticket
					break;

			}
		}
	}

	//trigger lead fire
	$lucep["raise_lead"](lead_opts);
	
	//disable the button
	btn_ref.disabled = true;
	
	//disable all the form elements
	CornerWidgetUI.elem_field_name.disabled = true;
	CornerWidgetUI.elem_field_tel.disabled = true;
	CornerWidgetUI.elem_field_service.disabled = true;
	
	btn_ref.innerHTML = "<img src='https://8d69a4badb4c0e3cd487-efd95a2de0a33cb5b6fcd4ec94d1740c.ssl.cf2.rackcdn.com/images/small-spinner.gif' alt='Please wait' />";

};

//Included to allow the Lucep JS API to init the UI once it is ready
window["$lucep_ui"] = CornerWidgetUI;
