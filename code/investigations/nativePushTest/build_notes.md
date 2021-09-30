## Project setup

### create a cordova project

nb: This project is pure cordova, there is no Angular on top.

`cordova create nativePushTest uk.ac.mmu.digitallabs.rs.nativepushtest nativePushTest`
`cordova plugin add phonegap-plugin-push@2.1.2`
`cordova platform add android@6.3.0`
`cordova platform add browser`


### create a firebase project 

new firebase project, then create an android application, then make sure the name matches the package name in cordova - the 'uk.ac.mmu.digitallabs.rs.nativepushtest' bit. download (for android) the google-services.json file

#### copy firebase config files into the project

They need to be linked into the `config.xml` file.

- in config.xml, under <platform name="android"> tag, added
	`<resource-file src="google-services.json" target="app/google-services.json" />` and copy over google provisioning from firebase to
	- ./platforms/android/google-services.json
	- ./google-services.json

- get the 'Server Key' from https://console.firebase.google.com (click your app name, then 'Project Overview cog' in the top left, then 'Project Settings', then 'Cloud Messaging' in the tab row at the top
	- The 'Server Key' is used when using the `send-hello` script as the first argument

- Build and run the app on Android. Launch it and open a web inspector. In the console, a string 'DEVICE ID' will appear. This is printed when the device registers with Google/Firebase, and will change whenever the app is uninstalled (but not updated/overwritten). Copy this ID; it is used when using the 'send-hello' script as the second argument.

### Using Firebase HTTP test server to send messages to the device

The 'send-hello.sh' script can be used in two ways. In both, bare spaces will break the script in any parameters, so substitute with underscores (`_`) for now.

1. Sending a banner notification

	`./send-hello.sh <SERVER KEY> <DEVICE ID> <`Title of alert`> <`Contents of alert`>`

2. Sending a background push notification

This will cause the app to refresh the latinate task, whether the app is running or not.

	`./send-hello.sh <SERVER KEY> <DEVICE ID> <`Title of alert`> <`Contents of alert`> <'trigger text'>`
	
	`<`trigger text`>` will cause the string to be stored in the `localStorage` `contentAvailable` field, and regenerate and store a latinate task.