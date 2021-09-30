/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
  // Application Constructor
  initialize: function() {
    document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
  },

  // deviceready Event Handler
  //
  // Bind any cordova events here. Common events are:
  // 'pause', 'resume', etc.
  onDeviceReady: function() {
    this.receivedEvent('deviceready');
    this.initialisePush();
    if(window.localStorage.getItem("latinate task")) {
      app.updateTaskFromStorage();
    } else {
      app.updateLatinateTask("No task","");
    }
    console.log("ready!");
  },

  updateTaskFromStorage: function updateTaskFromStorage() {
    app.updateLatinateTask("Latinate Task",window.localStorage.getItem("latinate task") ) ;
  },

  updateLatinateTask: function updateLatinateTask(k,v) {
    var eK = document.getElementById('k');
    var eV = document.getElementById('v');
    eK.innerHTML = k;
    eV.innerHTML = v;
  },

  // Update DOM on a Received Event
  receivedEvent: function(id) {
    var parentElement = document.getElementById(id);
    var listeningElement = parentElement.querySelector('.listening');
    var receivedElement = parentElement.querySelector('.received');

    listeningElement.setAttribute('style', 'display:none;');
    receivedElement.setAttribute('style', 'display:block;');

    console.log('Received Event: ' + id);
  },

  initialisePush: function initialisePush() {
    app.push = PushNotification.init({
      android:{}
    });
    app.push.on('registration',function(data){
      console.log("push.registration event, ", data);
      console.log("DEVICE ID: "+data.registrationId);
    });
    app.push.on('notification', function(data){
      console.log("push.notification event, ", data);
      if(data.hasOwnProperty("additionalData")) {
        window.localStorage.setItem("contentAvailable", data.additionalData.data);
        var req=new app.HttpClient();
        req.get("https://jsonplaceholder.typicode.com/todos/"+String(Math.ceil(Math.random()*10)),
                function(response) {
                  window.localStorage.setItem("latinate task",JSON.parse(response).title);
                  app.updateTaskFromStorage();
                } );
      }
    });

    app.push.on('error', function (error) {
      console.log(error);
      app.updateLatinateTask("Error",error);
    });
  }

};

app.HttpClient = function() {
  this.get = function(aUrl, aCallback) {
    var anHttpRequest = new XMLHttpRequest();
    anHttpRequest.onreadystatechange = function() {
      if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
        aCallback(anHttpRequest.responseText);
    };
    anHttpRequest.open( "GET", aUrl, true );
    anHttpRequest.send( null );
  };
};

app.initialize();
