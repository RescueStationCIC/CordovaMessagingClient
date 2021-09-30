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
    'pushSrvc',
    'uuid'
  ];

  function mainCtrl(
    $ionicPlatform,
    $scope,
    $state,
    $sce,
    pushSrvc,
    uuid
  ) {

    var vm=angular.extend(this, {

    });

    vm.isRescuer = false;
    vm.isRescuee = false;

    vm.pushConnected = false;
    vm.deviceId = "";

    vm.uuid = false;

    vm.inbound = { data: { },
                   rendered: "No messages yet." };

    vm.subscriptionFeedback = "";

    vm.restart = function restart() {
      var confirmed = window.confirm("Really clear everything?\nYou will need to do this on both devices.");
      if(confirmed) {
        window.localStorage.removeItem("role");
        window.localStorage.removeItem("uuid");
        vm.isRescuer = false;
        vm.isRescuee = false;
        vm.pushConnected = false;
        vm.uuid = false;
        vm.deviceId = "";
//        pushSrvc.setCallback( vm.dummyCallbackHandler );
        vm.subscriptionFeedback = "Reset completed.";

        vm.initialise();
      }
    };
    vm.dummyCallbackHandler = function dummyCallbackHandler(i) {
      console.log(" *** dummyCallbackHandler - inbound rejected containing ",i);
    };

    // restore any state in the interface
    if(window.localStorage.getItem("uuid")) {
      vm.uuid = window.localStorage.getItem("uuid");
      if(window.localStorage.getItem("role")) {
        vm.isRescuer = false;
        vm.isRescuee = false;
        if(window.localStorage.getItem("role")==="rescuer") {
          vm.isRescuer = true;
          vm.isRescuee = false;
        }
        if(window.localStorage.getItem("role")==="rescuee") {
          vm.isRescuer = false;
          vm.isRescuee = true; 
        }
      }
    }

    vm.initialise = function initialise() {

      vm.inbound.rendered = "No registrationId yet...";
      pushSrvc.initialisePush( function deviceNowConnected( data ){
        console.log("controller initialised push, got payload ",data );
        vm.inbound.rendered = "Got connected payload";
        // data.deviceId contains the device ID, hopefully, on a registration message
        if (data.hasOwnProperty('registrationId')===true) {
          vm.inbound.rendered = "Got connection registrationId of "+data.registrationId;
          vm.deviceId = data.registrationId;
          vm.pushConnected = true;
          pushSrvc.setCallback( vm.handleInbound );
          console.log("-- setting pushSrvc.callback to ",vm.handleInbound );
        }
      });
    };

    // only of use for broken subscriptions in past - not hooked in yet
    vm.restoreSubscriptionMaybe = function restoreSubscriptionMaybe(){
      if(window.localStorage.get("uuid") && window.localStorage.get("role")) {
        vm.uuid=window.localStorage.get("uuid");
        vm.role=window.localStorage.get("role");
        vm.inbound.rendered = "Resuming role as "+vm.role;
        vm.startSubscription( vm.role );
      }
    };

    vm.setRescuer = function setRescuer( newState ) {
      console.log("setting as rescuer", newState );
      vm.isRescuer = newState;
      vm.isRescuee = !newState;
    };

    vm.setRescuee = function setRescuee( newState ) {
      console.log("setting as rescue*e*", newState );
      vm.isRescuer = !newState;
      vm.isRescuee = newState;
    };

    vm.rescueeStartCodeScan = function rescueeStartCodeScan() {
      console.log("starting a QR code scan");
      cordova.plugins.barcodeScanner.scan(
        function(result) { // .text .format .cancelled
          console.log("scanned",result);
          if(result.cancelled===true) {
            console.log("aborted scan!");
            return;
          } else {
            if(result.format==="QR_CODE") {
              var sharedUuid = uuid.v4();
              window.localStorage.setItem("uuid", sharedUuid);
              console.log("sending UUID of "+sharedUuid);
              pushSrvc.send( result.text, "contact_from_rescuee",
                             {rescuer_device_id:vm.deviceId,
                              "sharedUuid":sharedUuid,
                              event:"rescuee_start" } );
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
      angular.merge( vm.inbound.data, data );
      vm.inbound.rendered = JSON.stringify(vm.inbound.data);

      if(data.hasOwnProperty("additionalData")) {
        if(data.additionalData.event === "rescuee_start") {
          window.localStorage.setItem("role","rescuer");
          // log our UUID
          console.log("got sharedUuid of "+data.additionalData.sharedUuid);
          window.localStorage.setItem("uuid", data.additionalData.sharedUuid);
          vm.uuid = data.additionalData.sharedUuid;

          // compose an ack message back
          pushSrvc.send( data.additionalData.rescuer_device_id,
                         "acknowledgement_from_rescuer",
                         { rescuee_device_id:vm.deviceId,
                           "sharedUuid":data.additionalData.sharedUuid,
                           event:"ack_from_rescuer" } );

          vm.startSubscription("rescuer");
        }
        if(data.additionalData.event === "ack_from_rescuer") {
          // do our UUIDs match?
          if( window.localStorage.getItem("uuid")===data.additionalData.sharedUuid ) {
            alert("UUIDs match, good to go");
            vm.uuid = window.localStorage.getItem("uuid");
            window.localStorage.setItem("role","rescuee");

            vm.startSubscription("rescuee");

          } else {
            alert("Error: Mismatched UUIDs!");
            console.log("stored UUID",window.localStorage.getItem("uuid"));
            console.log("roundtripped UUID",data.additionalData.sharedUuid);
          }
          // pof
          //alert("ack back");
        }
      }
    };

    vm.startSubscription = function startSubscription( role ) {
      //alert("NO I AM NOT SUBSCRIBING");
      // subscribe to "vm.uuid/role"
      var topic = vm.uuid + "_" + role;
      console.log( "subscribing to " + topic );
      pushSrvc.subscribe( topic, function() {
      } );
    };
    vm.pingRescuer = function pingRescuer() {
      pushSrvc.sendToTopic( vm.uuid + "_" + "rescuer", "from the rescuee", {"message":"hello from rescuee" } );
    };
    vm.pingRescuee = function pingRescuee() {
      pushSrvc.sendToTopic( vm.uuid + "_" + "rescuee", "from the rescuer", {"message":"hello from rescuer" } );
    };
    vm.initialise();

  }
})();
