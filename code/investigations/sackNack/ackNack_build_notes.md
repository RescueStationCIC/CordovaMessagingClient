- cordova-plugin-push@2.1.2 does not agree with cordova-plugin-barcodescanner of any version (build errors:
```
FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':transformClassesWithJarMergingForDebug'.
> com.android.build.api.transform.TransformException: java.util.zip.ZipException: duplicate entry: android/support/v13/view/DragAndDropPermissionsCompat.class
```
)

Solution: upgrade `phonegap-plugin-push` to version 2.2.1 (via https://github.com/phonegap/phonegap-plugin-push/issues/2243 )

Now using plugin set:
* cordova-plugin-whitelist 1.3.3 "Whitelist"
* phonegap-plugin-barcodescanner 8.0.0 "BarcodeScanner"
* phonegap-plugin-push 2.2.1 "PushPlugin"


---------

more build problems - push plugin being skipped


https://github.com/phonegap/phonegap-plugin-push/blob/master/docs/INSTALLATION.md
fix: https://github.com/phonegap/phonegap-plugin-push/issues/2229#issuecomment-369921541

```
I lost some time trying to find the right project.properties. 😄

So it's in platforms/android/project.properties that you should remove

cordova.system.library.3=com.android.support:support-v13:26.+
or replace it by

cordova.system.library.3=com.android.support:support-v13:27.+
(but I don't know the difference between the two of them)
```

QR code generation

- original plugin generates an android 'intent' and pops out to a different application - adding instead

https://github.com/monospaced/angular-qrcode

`npm install angular-qrcode`

------------

~~## Message sending and authorisation~~

~~Unless I'm doing something wrong which I can't identify, Google Firebase rejects messages sent from devices using the key (and also states it's worst practice).~~

~~Instead, you need to generate a [private key for the service account](https://firebase.google.com/docs/cloud-messaging/auth-server).~~

~~1. Go to 'Service Accounts' under the application settings in the Firebase console~~
~~2. Click 'generate new private key' button towards the bottom of the page~~
~~3.~~

- when using the hacky send:
	- Do not use `from` as a property in the `data` object, as it's a reserved word
	- Do not wrap the `key=GOOGLE_PROVIDED_KEY` in the `Authorization` header with quotes! the GOOGLE_PROVIDED_KEY must be as-is - eg, `key=ASD123:123123etc`
	- Make sure the `data` object is sent as an object to `$http` as it will manage serialisation itself (and confuse the Google servers if passed in as a string)

-----

## UUID exchange

When two devices are paired, they must exchange a key by which they can uniquely communicate with and identify each other. The Rescuer device will generate a UUID and send it to the Rescuee, and both devices will make a record of this. On recording it, both devices will then subscribe to this inbox for notifications, differentiating on their roles by watching a UUID/er or UUID/ee inbox.

### UUID generation

[angular-uuid](https://github.com/munkychop/angular-uuid) is a wrapper for the DigitalLabs' preferred UUID generator.

`npm install --save angular-uuid`

### Channels, topics and subscription

We need to create a channel and subscribe to it. The [push API is documented here](https://github.com/phonegap/phonegap-plugin-push/blob/master/docs/API.md). A seemingly naïf implementation ( [via](https://firebase.google.com/docs/cloud-messaging/android/topic-messaging) ) is to specify a 'topic' as key when posting a message, which is distributed to all subscribed clients.

In terms of methods on the Angular/Cordova side, we have:

`push.subscribe(topic, successHandler, errorHandler)`
`push.unsubscribe(topic, successHandler, errorHandler)`

and to send (via CURL):

```
curl -X POST -H "Authorization: Bearer ya29.ElqKBGN2Ri_Uz...HnS_uNreA" -H "Content-Type: application/json" -d '{
  "message": {
    "topic" : "foo-bar",
    "notification": {
      "body": "This is a Firebase Cloud Messaging Topic Message!",
      "title": "FCM Message"
    }
  }
}' https://fcm.googleapis.com/v1/projects/myproject-b5ae1/messages:send HTTP/1.1
```

A [note from the Firebase documentation](https://firebase.google.com/docs/cloud-messaging/android/topic-messaging): (*Receive and handle topic messages*)

> FCM delivers topic messages in the same way as other downstream messages.

> To receive messages, use a service that extends FirebaseMessagingService. Your service should override the onMessageReceived and onDeletedMessages callbacks. It should handle any message within 20 seconds of receipt (10 seconds on Android Marshmallow). The time window may be shorter depending on OS delays incurred ahead of calling onMessageReceived. After that time, various OS behaviors such as Android O's background execution limits may interfere with your ability to complete your work. For more information see our overview on message priority.

> onMessageReceived is provided for most message types, with the following exceptions:

> Notification messages delivered when your app is in the background. In this case, the notification is delivered to the device’s system tray. A user tap on a notification opens the app launcher by default.
> Messages with both notification and data payload, both background and foreground. In this case, the notification is delivered to the device’s system tray, and the data payload is delivered in the extras of the intent of your launcher Activity.

Referring to the [phonegap-plugin-push API documentation](https://github.com/phonegap/phonegap-plugin-push/blob/master/docs/API.md#pushnotificationcreatechannel)

## Authentication

On the Firebase project page, look at Develop→Authentication→Sign-in method (tab). Maybe enable 'Anonymous'?

Under Develop→Authentication→Templates, a "Subject" has a project number (here, it is `project-930939697602`) - maybe this is the alternative endpoint for topic HTTP posts? 

### 400 error and bomb out on topic subscriptions

Subsacribing to topics with / in their path caused a 400 and unhandled core dump - switched out to an underscore, which is apparently a valid character.




