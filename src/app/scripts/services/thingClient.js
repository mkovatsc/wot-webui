'use strict';

/**
 * @ngdoc service
 * @name wotwebui.service:thingClient
 * @description
 * # thingClient
 */
function thingClient ($http/* ,coap */) {
  let restcall = function restcall (method, uri, payload) {
    let scheme = uri.substring(0, uri.indexOf(':'));
    if (scheme === 'http') {
      let req = {
        method: method,
        url   : uri,
        data  : payload
      };
      return $http(req);
    } else if (scheme === 'coap') {
      // Uncomment after getting angular-coap
     /* return CoAP.doCoapReq(method, uri, JSON.stringify(payload))
        .then($http.defaults.transformResponse); */
    } else {
      throw Error('unknown uri scheme');
    }
  };

  this.readProperty = function readProperty (thing, property) {
    function applyNewValue (value) {
      property.value = value;
     // property.history.push(value);

      // ensure size
     /* while (property.history.length >= 20) {
        property.history.shift();
      } */
    }

    if (property.link[0].href) {
      return restcall('GET', property.link[0].href)
        .then(function (res) {
          if (res.data) {
            return res.data;
          } else {
            return JSON.parse(res).value;
          }

        })
        .then(applyNewValue);
    }

    /* if (thing.protocols['HTTP']) {
      return $http.get(thing.protocols['HTTP'].uri + '/' + property.name)
        .then(function (res) {
          return res.data.value;
        })
        .then(applyNewValue);
    } else if (thing.protocols['CoAP']) {
      // Uncomment after getting angular-coap
     /* return CoAP.get(thing.protocols['CoAP'].uri + "/" + property.name)
        .then(function (res) {
          return JSON.parse(res.payload).value
        })
        .then(applyNewValue); *!/
    } */
  };

  this.writeProperty = function writeProperty (thing, property) {
    if (property.link[0].href) {
      return restcall('PUT', property.link[0].href, { value: property.value });
    }

   /* if (thing.protocols['HTTP']) {
      return $http.put(thing.protocols['HTTP'].uri + '/' + property.name, { 'value': property.value })
    } else {
      // Uncomment after getting angular-coap
      // return CoAP.put(thing.protocols['CoAP'].uri + "/" + property.name, { "value": property.value })
    } */
  };

  this.callAction = function callAction (thing, action, param) {
    let payload = { value: param };
    if (action.xsdParamType === 'WoTScript') {
      payload = param;
    }

    if (action.uri) {
      return restcall('POST', action.uri, payload);
    }

   /* if (thing.protocols['HTTP']) {
      return $http.post(thing.protocols['HTTP'].uri + '/' + action.name, payload);
    } else {
      // Uncomment after getting angular-coap
      // return CoAP.post(thing.protocols['CoAP'].uri + '/' + action.name, payload);
    } */
  };
}

thingClient.$inject = ['$http'/* ,'coap' */];
module.exports = thingClient;
