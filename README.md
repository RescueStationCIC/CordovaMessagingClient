# THIS RESPOSITORY IS NOW PUBLIC

# RescueStation-DemoMobileClient
A mobile client to demonstrate the RescueStation messaging concept

There are three versions of an application to different states of completeness in here.

> **IMPORTANT**: Each Application will require a 'google-services.json` file. This can be the same file for all of your applications - you can also use the same FCM Secret Key for multiple applications. See below for instructions on how to create your applications with Google FCM.


## 1. NativePushTest

This is a rudimentary, minimal application to connect to FCM and dump a registration ID on sign-in, and a message on receipt.

There is a shell script `send-hello.sh` which can be used to send messages to devices; run the script without arguments to see parameters. You will need to copy-and-paste a device registration ID from the Android/Chrome Device Inspector in the Chrome debugger to the terminal.

## 2. AckNack

This version builds on NativePushTest, but follows bad practice - the Application Secret is inline with the code.

This version presents the Device Registration ID as a QR Code which can be scanned by another device and used as a destination for a message.

## 3. SackNack

This *S*erver-*AckNack* is dependant on being able to use a remote HTTP server to handle the communications with Google's FCP. 

In `services/push.service.js` the variable `SERVER_ROOT` (on line 1) is used to specify the URL which will host the remote HTTP server (this will have to be set to a Heroku [or other internet-discoverable] hostname and port, or a device whose name or IP address can be resolved on a local WiFi network).

This version follows much better practice and leaves the Application Secret on the server (which needs to be set in the corresponding server-repository in `/service/MessageService.js`).

This time, the server is contacted to generate a UUID over HTTP (which could later be stored or recorded), and this UUID is shared via QR Code, rather than a Device ID. Both devices then subscribe to this UUID as a *topic*, meaning they are both alerted when something posts to the *topic*, and can reject or accept the contents as they see fit, based on their role.

# Warnings

None of these applications maintain state after quitting. They are simple proofs-of-concept that show the basics of using the Firebase Communication platform. It is up to you to persist state and configuration, should you need it.

# Creating Projects with FCM at Google

Visit the [Google Firebase Console](https://console.firebase.google.com/), signing in with the account you with which you want to associate your Firebase project.

From the start page, click '+ Add Project'. In the pop-up panel that appears, enter a 'Project name', which is used as an umbrella reference for multiple Applications. The project ID will be derived from this. The 'Analytics Location' can optionally be set to the UK, but the 'Cloud Firestore location' should be left as 'us-central'.

You may wish to turn off the 'Use the sharing setting for sharing Google Analytics for Firebase data' to avoid potential GDPR issues. You will then be presented with a 'Customise data sharing for your new project' panel. Ensure everything is turned off, then click the blue '**Create project**' button in the lower right.

This will land you on your Project Overview page. From here, you will need to create an *Application*, which will give you the Server Key and `google-service.json` file you need.

Click the Android logo on the 'Project Overview' page. You will be presented with an 'Add Firebase to your Android app' page. Specify the following parameters:

1. *Android package name* should be set to the dotted name you provide when you create your Angular/Cordova/Ionic application. This will be reflected in the `config.xml` file at the root of your project, in the `<widget Id="" Version="1.0.0" `... parameter.
2. *App nickname (optional)* is a convenience name for you, as a developer; it makes it easy to recognise your Application in the Firebase console. It has no meaning beyond this console and has no bearing on your Application.
3. (*You can ignore 'Debug signing certificate SHA-1 (optional)*)

You may then click '**Register app**'.

You are then prompted, with a **big blue button labelled '⬇️ Download google-services.json'**. This is a the first of two critical items you need.

This file needs to be copied into `platforms/android/` and it's a good idea to keep a copy in your off-project safe place as well. It is needed by the `phonegap-plugin-push` plugin every time you build your application using Cordova (it will be removed if you `cordova plugin remove phonegap-plugin-push` for any reason, so will need to copy it back when re-adding the plugin.)

Click next and 'skip' this step to return to the Firebase console, with your project name at the top.

Next, click the cog in the top-left by **'Project Overview'** and go to **'Project Settings'**. Under the **'Cloud Messaging'** tab along the top, copy the **Server key** **Token**. This is the token you will need for posting to the Firebase HTTP server; it is used in two places -- in the *ackNack* application and in the server component used by *sackNack*.

1. In **ackNack**, in `js/services/push.services.js` under `window.FCMKEY`.
2. In **sackNack**, it is used in the *server* applications only, and not embedded in the Mobile native applications, and can be found in `service/MessageService.js` under `const FCMKEY`.

# Bonus Cordova Minefields (you may or may not suffer)

Ensure you install the correct versions of plugins and environments per-project as indicated in the project directories.

You may find an unshakeable build problem at some stage complaining about Android support libraries - if so, make a backup first and try the following: edit (from the project root) `platforms/android/project.properties`, looking for any lines that reference `com.android.support-v4` and changing them to `com.android.support-v13`. Build again.

This problem is caused by plugins that fight for different versions of the same support libraries when installing; manually editing the file will correct this.

