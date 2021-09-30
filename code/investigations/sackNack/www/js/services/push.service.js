const SERVER_ROOT = "https://rescuestationpush.herokuapp.com:443"; // heroku service hides secret

(function() {
  'use strict';
  console.log("pushSrvc executed");

  angular
    .module('push', [])
    .factory('pushSrvc', pushSrvc)
  ;

  pushSrvc.$inject = [
    '$http'
  ];
  function pushSrvc(
    $http
  ) {
    var service = {};

    service.SERVER_ROOT = SERVER_ROOT;

    service.push = undefined;
    service.registrationId = undefined;
    service.callbackHandler = undefined;

    service.subscribeCallbackHandler = undefined;
    service.timeoutMs = undefined;

	  service.setTimeout = function setTimeout(millis) {
		  service.timeoutMs = millis;
	  };

    service.initialisePush = function initialisePush( registeredCallback ) {
      service.push = PushNotification.init({
        android:{}
      });
      service.push.on('registration',function( data ){
        console.log("push.registration event, ", data);
        console.log("DEVICE ID: "+data.registrationId);
        service.registrationId = data.registrationId;
        if( registeredCallback !== undefined ) {
          //service.setCallback( registeredCallback );
          console.log( "- invoking callback for registration with ", data );
          registeredCallback( data );
        }
      });
      service.push.on('notification', function(data){
        console.log("push.notification event, ", data);
        if(data.hasOwnProperty("additionalData")) {
          if(data.additionalData.hasOwnProperty("payload")) {
            service.callbackHandler( data.additionalData );
          } else {
            console.log("inbound message missing an additionalData.payload property");
          }
        } else {
          console.log("inbound messaeg missing an additionalData property");
        }
      });

      service.push.on('error', function (error) {
        console.log(error);
      });
    };

    // pass in a notification object in payload.notification
    // pass in recipient device in payload.recipient_id,
    //   or recipient topic as payload.recipient_id of "/topics/*YOUR_TOPIC*"
	  service.sendPayload = function sendPayload( payload ) {

      console.log( " → asked to send this payload:", payload );

      var sendRequest = { method: 'POST',
                          url: SERVER_ROOT + '/messages',
                          data: JSON.stringify(payload)
                         };

      if(service.timeoutMs!==undefined) {
      	sendRequest.timeout = service.timeoutMs;
      }
      console.log('push.service.sendPayload - using ',sendRequest );

      return $http( sendRequest ); // send back a promise
	  };

    service.setCallback = function setCallback( handler ) {
      service.callbackHandler = handler;
    };

    // subscription handling

    service.subscribe = function subscribe( topic ) {
      service.push.subscribe( topic, function subscribeSuccess(){
        console.log("push.service - subscription to "+topic+"' successful!");

        service.push.on('registration', function (data) {
          //alert('registrationId:' + data.registrationId);
        });

        service.push.on('notification', function (data) {
          //alert('push:' + JSON.stringify(data));
        });

        service.push.on('error', function (e) {
          //alert('error: ' + e.message);
        });

      }, function subscribeFailure( err ){
        console.log("push.service - subscription to '"+topic+"' failed, error:", err);
        throw( err );
      });
    };

    return service;
  }

})();
