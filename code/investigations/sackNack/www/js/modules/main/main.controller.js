(function () {
  'use strict';

  angular
    .module('main' )
    .controller('mainCtrl', mainCtrl);

  mainCtrl.$inject = [
    '$ionicPlatform',
    '$scope',
    '$state',
    '$sce',
    '$http',
    'pushSrvc',
    'uuid'
  ];
2
  function mainCtrl(
    $ionicPlatform,
    $scope,
    $state,
    $sce,
    $http,
    pushSrvc,
    uuid
  ) {

    var vm=angular.extend(this, {

    });

    vm.isRescuer = false;
    vm.isRescuee = false;

    vm.role = undefined;
    vm.otherRole = undefined;

	  vm.ROLES = { RESCUER : 0,
			  	       RESCUEE : 1 };
	  vm.ROLE_STRINGS = [ "Rescuer",
						            "Rescuee" ];
	  vm.MESSAGE_TYPE_ID = { ACK : 0,
						               NACK : 1,
						               CONNECTION_REQUEST: 2,
						               CONNECTION_RESPONSE: 3,
						               MESSAGE: 4 };
    vm.MESSAGE_PAYLOAD_TYPE_ID = { "STRING": 0,
                                   "INTEGER": 1,
                                   "JSON": 2
                                 };
	  vm.ACTIVITY = { SHOW: 1,
					          SCAN: 2 };
	  vm.MESSAGE_TIMEOUT_SECONDS = 10;

    vm.pushConnected = false;
    vm.activity = 0;
    vm.registrationId = "";

    vm.uuid = false;

    vm.inbound = { data: { },
                   rendered: "No messages yet." };

    vm.subscriptionFeedback = "";

    vm.pendingMessage = {};

    vm.initialise = function initialise() {

      vm.inbound.rendered = "No registrationId yet...";

      pushSrvc.initialisePush( function deviceNowConnected( data ){
        console.log("controller initialised push, got payload ",data );
        vm.inbound.rendered = "Got connected payload";
        if (data.hasOwnProperty('registrationId')===true) {

          vm.registrationId = data.registrationId;
          vm.pushConnected = true;

          pushSrvc.setCallback( vm.handleInbound );
          pushSrvc.setTimeout( vm.MESSAGE_TIMEOUT_SECONDS * 1000 );
        }
      });
    };

    vm.setRescuer = function setRescuer( ) {
      console.log("setting as rescuer");
      vm.role = vm.ROLES.RESCUER;
      vm.otherRole = vm.ROLES.RESCUEE;
      vm.activity = vm.ACTIVITY.SHOW;
    };

    vm.setRescuee = function setRescuee( ) {
      console.log("setting as rescue*e*");
      vm.role = vm.ROLES.RESCUEE;
      vm.otherRole = vm.ROLES.RESCUER;
      vm.activity = vm.ACTIVITY.SCAN;
    };

    vm.startCodeScan = function startCodeScan() {
      console.log("starting a QR code scan");
      cordova.plugins.barcodeScanner.scan(
        function(qrResult) { // .text .format .cancelled
          console.log("scanned",qrResult);
          if(qrResult.cancelled===true) {
            console.log("aborted scan!");
            return;
          } else {
            if(qrResult.format==="QR_CODE") {
              var temp_uuid = uuid.v4();
			        // request a connection uuid
              var connection_payload = {
                method: 'POST',
                url: pushSrvc.SERVER_ROOT + "/connections",
                headers: {
                  'Content-Type':'application/json'
                },
                data: {
                  'id': temp_uuid
                }
              };
              console.log("requesting connection ID creation - sending ", connection_payload );
			        $http( connection_payload )
			  	      .success(
			  		      function(data, status, headers, config) {
			  		        // construct a outbound message
			  		        var payload = {
			  			        connection_id: data.id, // we have a connection uuid in data .id
			  			        sender_id: vm.registrationId,
			  			        message_id: temp_uuid,
			  			        message_type: vm.MESSAGE_TYPE_ID.CONNECTION_REQUEST,
			  			        sender_role: vm.role,
			  			        payload: qrResult.text,
			  			        payload_format_type: vm.MESSAGE_PAYLOAD_TYPE_ID.STRING
			  		        };
					          pushSrvc.sendPayload( payload ).then(function sentPayloadOkay(data){
						          console.log('initial connection - sent, got', payload, data);
                    }, function errorPayloadSend( error ) {
						          console.log('initial connection - failed send, error', payload, error);
					          });
			  	        }).error( function(error) {
			  		        // failed to get connection uuid from the server
			  		        alert("Failed requesting a connection UUID.");
		  		        });
            }
          }
        },
        function(error) {
          console.log("error scanning",error);
        },
        {
          showTorchButton: false,
          saveHistory: false,
          prompt: "Scan the Rescuer's Code"
        }
      );
    };

    vm.handleInbound = function handleInbound( data ) {
      console.log("got inbound message", data);

      if(data.hasOwnProperty("payload")) {
        angular.merge( vm.inbound.data, data.payload );
        vm.inbound.rendered = "Got inbound message - type "+
          Object.keys(vm.MESSAGE_TYPE_ID)[ data.payload.message_type ];

        if(data.payload.hasOwnProperty("sender_id")) {
          if(data.payload.sender_id===vm.registrationId ) {
            // skip this; we sent it.
            console.log("ignoring message as we sent it!", data);
            return;
          }
        }

        // return payload to correct data format
        var payload = data.payload;
        if(payload.payload_format_type === vm.MESSAGE_PAYLOAD_TYPE_ID.INTEGER) {
          payload.payload = parseInt( payload.payload );
        } else if (payload.payload_format_type === vm.MESSAGE_PAYLOAD_TYPE_ID.JSON ) {
          payload.payload = JSON.parse( payload.payload );
        }

        // is this a connection request?
        if (payload.message_type === vm.MESSAGE_TYPE_ID.CONNECTION_REQUEST) {
          // connection request! send back a confirmation - response to message in line 127
          var responsePayload = {
            connection_id: payload.connection_id,
            sender_id: vm.registrationId,
            recipient_id: payload.sender_id,
            message_id: payload.message_id,
            message_type: vm.MESSAGE_TYPE_ID.CONNECTION_RESPONSE,
            sender_role: vm.role,
            payload: payload.payload,
            payload_format_type: vm.MESSAGE_PAYLOAD_TYPE_ID.STRING
          };
          pushSrvc.sendPayload( responsePayload ).then( function sendPayloadOkay(indata) {
            console.log('intial connection confirmation sent okay - got ',indata );
            vm.uuid = payload.connection_id;
            // subscribe to this topic
            pushSrvc.subscribe( vm.uuid );
          }, function failedSending(err) {
            console.log('error sending first message - ',err);
            alert("Problem sending confirmation payload - "+err);
          });
        }
        if (payload.message_type === vm.MESSAGE_TYPE_ID.CONNECTION_RESPONSE) {
          // this is the confirmation of the other user - message from line 185
          vm.uuid = payload.connection_id;
          // subscribe to this topic
          pushSrvc.subscribe( vm.uuid );
        }

        if (payload.message_type === vm.MESSAGE_TYPE_ID.MESSAGE) {
          // an inbound message
          alert(payload.payload.message);
          return;
          // don't ack, at least on this version!

          vm.pendingMessage = payload.payload;
          // send a delivery ack before displaying
          var responsePayload = {
            connection_id: vm.uuid,
            sender_id: vm.registrationId,
            recipient_id: payload.sender_id,
            message_id: payload.message_id,
            message_type: vm.MESSAGE_TYPE_ID.ACK,
            sender_role: vm.role,
            payload: "0",
            payload_format_type: vm.MESSAGE_PAYLOAD_TYPE_ID.INTEGER
          };
          pushSrvc.sendPayload( responsePayload ).then( function sendPayloadOkay(indata) {
            console.log('message '+responsePayload.messageId+' acknowledgement delivered okay.');
            //if(payload.payload.hasOwnProperty("message")) {
            //alert(payload.payload.message);
            //}
          }, function failedSending(err) {
            console.log('error acknowledgeing '+responsePayload.message_id);
            alert("Problem acknowledgeing an inbound message.");
          });
        }
      }
    };

    vm.pingOther = function pingOther() {
      var responsePayload = {
        connection_id: vm.uuid,
        sender_id: vm.registrationId,
        recipient_id: "/topics/" + vm.uuid,
        message_id: uuid.v4(),
        message_type: vm.MESSAGE_TYPE_ID.MESSAGE,
        sender_role: vm.role,
        payload: JSON.stringify( { "message" : "hello"} ),
        payload_format_type: vm.MESSAGE_PAYLOAD_TYPE_ID.JSON
      };
      pushSrvc.sendPayload( responsePayload ).then( function sendPayloadOkay(indata) {
        console.log('topic message '+responsePayload.message_id+' delivered okay.');

      }, function failedSending(err) {
        console.log('error sending '+responsePayload.message_id);
        alert("Problem sending message.");
      });

    };

    vm.initialise();

  }
})();
