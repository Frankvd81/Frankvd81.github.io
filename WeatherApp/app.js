// JavaScript code for the BLE Scan example app.

// Application object.
var app = {};

// Device list.
app.devices = {};
 
// UI methods.
app.ui = {}; 
/**  
 * Object that holds SensorTag UUIDs.
 */
app.sensortag = {};


// Timer that updates the device list and removes inactive
// devices in case no devices are found by scan.
app.ui.updateTimer = null;

app.initialize = function() 
{
	document.addEventListener('deviceready', this.onDeviceReady, false);
};



// Start the scan. Call the callback function when a device is found.
// Format:
//   callbackFun(deviceInfo, errorCode)
//   deviceInfo: address, rssi, name
//   errorCode: String
app.startScan = function(callbackFun)
{ 
	app.stopScan();

	evothings.ble.startScan(
		function(device)
		{
			// Report success. Sometimes an RSSI of +127 is reported.
			// We filter out these values here.
			if (device.rssi <= 0)
			{
				callbackFun(device, null);
			}
		},
		function(errorCode)
		{
			// Report error.
			callbackFun(null, errorCode);
		}
	);
};

// Stop scanning for devices.
app.stopScan = function()
{ 
	evothings.ble.stopScan();
	app.ui.displayStatus('Scanning stopped');
}; 

// Called when Start Scan button is selected.
app.ui.onStartScanButton = function()
{
	app.startScan(app.ui.deviceFound);
	app.ui.displayStatus('Scanning...');
	app.ui.updateTimer = setInterval(app.ui.displayDeviceList, 500);
	setTimeout(app.ui.onStopScanButton, 5000);
};

// Called when Stop Scan button is selected.
app.ui.onStopScanButton = function()
{
	app.stopScan(); 
	//app.devices = {};
	//app.ui.displayStatus('Scan Paused');
	app.ui.displayDeviceList();
	clearInterval(app.ui.updateTimer);
};

  
// Called when a device is found.
app.ui.deviceFound = function(device, errorCode)
{
	if (device)
	{
		// Set timestamp for device (this is used to remove
		// inactive devices).
		device.timeStamp = Date.now();

		// Insert the device into table of found devices.
		app.devices[device.address] = device;
	}
	else if (errorCode)
	{
		app.ui.displayStatus('Scan Error: ' + errorCode);
	} 
};

// Display the device list.
app.ui.displayDeviceList = function()
{
	// Clear device list.
	$('#found-devices').empty();
 
	var timeNow = Date.now();
    $.each(app.devices, function(key, device)
	{

    var base=3;
	var SenseName;
	var CurrentTemp, MaxTemp, MinTemp;
	var SensorType;
	var AdvHeader, CompID;
	var SensorAdvString=decodeBase64(device.scanRecord);
		   
		AdvHeader = 256*SensorAdvString.charCodeAt(base+3)+SensorAdvString.charCodeAt(base+2); 
		CompID = 256*SensorAdvString.charCodeAt(base+5)+SensorAdvString.charCodeAt(base+4); 
		SensorType = SensorAdvString.charCodeAt(base+6);
		
		if (AdvHeader == 33130) //0x816A
		{
			//if (CompID==56317)	//0xDBFD
			switch (CompID)
			{ 
			  case 56061: 			  	//0xDAFD
			     SenseName = " Buiten";
				 break;
			  case 56317:				//0xDBFD
			     SenseName = " Binnen_1";
				 break;
			  default:
			     SenseName = " Onbekend"
			} 
			// Get the sensor data from the advertising string
			CurrentTemp = temperatureCelcius(SensorAdvString.charCodeAt(base+10), SensorAdvString.charCodeAt(base+9),
								   SensorAdvString.charCodeAt(base+8), SensorAdvString.charCodeAt(base+7));
			CurrentHumidity = (16777216*SensorAdvString.charCodeAt(base+14)+ 65536*SensorAdvString.charCodeAt(base+13) +
				  			   256*SensorAdvString.charCodeAt(base+12)+       SensorAdvString.charCodeAt(base+11))/1024;
			CurrentHumidity = Math.round(CurrentHumidity * 10) / 10;			   				   
			CurrentPressure = (16777216*SensorAdvString.charCodeAt(base+18)+ 65536*SensorAdvString.charCodeAt(base+17) +
				  			   256*SensorAdvString.charCodeAt(base+16)+       SensorAdvString.charCodeAt(base+15))/100;
			CurrentPressure	= Math.round(CurrentPressure);
			
			// Map the RSSI value to a width in percent for the indicator.
			var rssiWidth = 1; // Used when RSSI is zero or greater.
			if (device.rssi < -100) { rssiWidth = 100; }
			else if (device.rssi < 0) { rssiWidth = 100 + device.rssi; }

			// Create tag for device data.
			var element = $(
				'<li>'
				+	'<strong>' + "Temperatuur Sensor" + SenseName + '</strong><br />'
				// Do not show address on iOS since it can be confused
				// with an iBeacon UUID.
				//+	(evothings.os.isIOS() ? '' : device.address + '<br />')   
				//+   "RSSI value: " + device.rssi  
				//+ 	'<div style="background:rgb(225,0,0);height:20px;width:'
				//+ 		rssiWidth + '%;"></div>'
				//+ "Advertiser header: " + AdvHeader + '<br />'
				//+ "Company ID: " + CompID + '<br />'
				//+ "SensorType: " + SensorType + '<br />'
				+ "Temperatuur: " + CurrentTemp + " C" + '<br />'
				+ "Rel. Luchtvochtigheid: " + CurrentHumidity + ' %Rh <br />' 
				+ "Luchtdruk: " + CurrentPressure + ' hPa <br />' 
				+ "Signaalsterkte: " + device.rssi  
				+ 	'<div style="background:rgb(225,0,0);height:20px;width:'
				+ 		rssiWidth + '%;"></div>'
				+ '</li>'
			); 

				$('#found-devices').append(element);
				//console.log('Temperature:');
			
		}
	});
	//if (device.timeStamp + 10000 > timeNow) {
	//		app.stopScan(); 
	//	}
};

// Display a status message
app.ui.displayStatus = function(message)
{
	$('#scan-status').html(message);
};

decodeBase64 = function(s) 
{
    var e={},i,b=0,c,x,l=0,a,r='',w=String.fromCharCode,L=s.length;
    var A="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for(i=0;i<64;i++){e[A.charAt(i)]=i;}
    for(x=0;x<L;x++){
        c=e[s.charAt(x)];b=(b<<6)+c;l+=6;
        while(l>=8){((a=(b>>>(l-=8))&0xff)||(x<(L-2)))&&(r+=w(a));}
    }
    return r;
}; 

temperatureCelcius = function (v4,v3,v2,v1) {
	// The temperature in degree C is coded as 4 values v1,2,3,4,  This is 32 bit signed value
	// bit 31 is the sign bit for temperatures below zero
	// bit [30:0] holds the temparature
	var t=0;
	if (v4 > 127) 
	{
		v4=v4-128;
		t= ((16777216*v4+65536*v3+256*v2+v1)-2147483648)/100;
    }
	else{
		t= (16777216*v4+65536*v3+256*v2+v1)/100;
	}
	//console.log('  -> Temperature: ' + t);
	return t;
}



/**
 * Debug logging of found services, characteristics and descriptors.
 */
app.logAllServices = function(device)
{
	// Here we simply print found services, characteristics,
	// and descriptors to the debug console in Evothings Workbench.

	// Notice that the fields prefixed with "__" are arrays that
	// contain services, characteristics and notifications found
	// in the call to device.readServices().

	// Print all services.
	console.log('Found services:');
	for (var serviceUUID in device.__services)
	{
		var service = device.__services[serviceUUID];
		console.log('  service: ' + service.uuid);

		// Print all characteristics for service.
		for (var characteristicUUID in service.__characteristics)
		{
			var characteristic = service.__characteristics[characteristicUUID];
			console.log('    characteristic: ' + characteristic.uuid);

			// Print all descriptors for characteristic.
			for (var descriptorUUID in characteristic.__descriptors)
			{
				var descriptor = characteristic.__descriptors[descriptorUUID];
				console.log('      descriptor: ' + descriptor.uuid);
			}
		} 
	}
};  


app.initialize();
