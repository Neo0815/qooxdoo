/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2013 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Richard Sternagel (rsternagel)

************************************************************************ */

/**
 * This class is internal because it's tailored to {@link qx.io.rest.Resource}
 * which needs more functionality than {@link qx.bom.request.Xhr} provides.
 * The usage of {@link qx.io.request.Xhr} isn't possible either due to it's qx.Class nature.
 *
 * For alternatives to this class have a look at:
 *
 * * "qx.bom.request.Xhr" (low level, cross-browser XHR abstraction compatible with spec)
 * * "qx.io.request.Xhr" (high level XHR abstraction)
 *
 * A wrapper of {@link qx.bom.request.Xhr} which offers:
 *
 * * set/get HTTP method, URL, request data and headers
 * * retrieve the parsed response as object (content-type recognition)
 * * more fine-grained events such as success, fail, ...
 * * supports hash code for request identification
 *
 * It does *not* comply the interface defined by {@link qx.bom.request.IRequest}.
 *
 * <div class="desktop">
 * Example:
 *
 * <pre class="javascript">
 *  var req = new qx.bom.request.SimpleXhr("/some/path/file.json");
 *  req.setRequestData({"a":"b"});
 *  req.once("success", function successHandler() {
 *    var response = req.getResponse();
 *  }, this);
 *  req.once("fail", function successHandler() {
 *    var response = req.getResponse();
 *  }, this);
 *  req.send();
 * </pre>
 * </div>
 *
 * @internal
 */
qx.Bootstrap.define("qx.bom.request.SimpleXhr",
{

  extend: Object,

  /**
   * @param url {String?} The URL of the resource to request.
   * @param method {String?"GET"} The HTTP method.
   */
  construct: function(url, method) {
    if (url !== undefined) {
      this.setUrl(url);
    }

    this.setMethod((method !== undefined) ? method : "GET");
    this._transport = this._registerTransportListener(this._createTransport());

    qx.core.ObjectRegistry.register(this);

    this.__requestHeaders = [];
    this.__parser = this._createResponseParser();
  },

  members :
  {
    /*
    ---------------------------------------------------------------------------
      PUBLIC
    ---------------------------------------------------------------------------
    */

    /**
     * Sets a request header.
     *
     * @param key {String} Key of the header.
     * @param value {String} Value of the header.
     * @return {qx.bom.request.SimpleXhr} Self for chaining.
     */
    setRequestHeader: function(key, value) {
      this.__requestHeaders[key] = value;
      return this;
    },

    /**
     * Gets a request header.
     *
     * @param key {String} Key of the header.
     * @return {String} The value of the header.
     */
    getRequestHeader: function(key) {
      return this.__requestHeaders[key];
    },

    /**
     * Sets the URL.
     *
     * @param url {String} URL to be requested.
     * @return {qx.bom.request.SimpleXhr} Self for chaining.
     */
    setUrl: function(url) {
      if (qx.lang.Type.isString(url)) {
        this.__url = url;
      }
      return this;
    },

    /**
     * Gets the URL.
     *
     * @return {String} URL to be requested.
     */
    getUrl: function() {
      return this.__url;
    },

    /**
     * Sets the HTTP-Method.
     *
     * @param method {String} The method.
     * @return {qx.bom.request.SimpleXhr} Self for chaining.
     */
    setMethod: function(method) {
      if (qx.util.Request.isMethod(method)) {
        this.__method = method;
      }
      return this;
    },

    /**
     * Gets the HTTP-Method.
     *
     * @return {String} The method.
     */
    getMethod: function() {
      return this.__method;
    },

    /**
     * Sets the request data to be send as part of the request.
     *
     * The request data is transparently included as URL query parameters or embedded in the
     * request body as form data.
     *
     * @param data {String|Object} The request data.
     * @return {qx.bom.request.SimpleXhr} Self for chaining.
     */
    setRequestData: function(data) {
      if (qx.lang.Type.isString(data) || qx.lang.Type.isObject(data)) {
        this.__requestData = data;
      }
      return this;
    },

    /**
     * Gets the request data.
     *
     * @return {String} The request data.
     */
    getRequestData: function() {
      return this.__requestData;
    },

    /**
     * Gets parsed response.
     *
     * If problems occured an empty string ("") is more likely to be returned (instead of null).
     *
     * @return {String|null} The parsed response of the request.
     */
    getResponse: function() {
      if (this.__response !== null) {
        return this.__response;
      } else {
        return (this._transport.responseXML !== null) ? this._transport.responseXML : this._transport.responseText;
      }

      return null;
    },

    /**
     * Gets low-level transport.
     *
     * Note: To be used with caution!
     *
     * This method can be used to query the transport directly,
     * but should be used with caution. Especially, it
     * is not advisable to call any destructive methods
     * such as <code>open</code> or <code>send</code>.
     *
     * @return {Object} An instance of a class found in
     *  <code>qx.bom.request.*</code>
     */
     // This method mainly exists so that some methods found in the
     // low-level transport can be deliberately omitted here,
     // but still be accessed should it be absolutely necessary.
     //
     // Valid use cases include to query the transport’s responseXML
     // property if performance is critical and any extra parsing
     // should be avoided at all costs.
     //
    getTransport: function() {
      return this._transport;
    },

    /**
     * Sets (i.e. override) the parser for the response parsing.
     *
     * @see {@link qx.util.ResponseParser#setParser}
     *
     * @param parser {String|Function}
     * @return {Function} The parser function
     */
    setParser: function(parser) {
      return this.__parser.setParser(parser);
    },

    /**
     * Whether request completed (is done).

     * @return {Boolean} Whether request is completed.
     */
    isDone: function() {
      return (this._transport.readyState === qx.bom.request.Xhr.DONE);
    },

    /**
     * Returns unique hash code of object.
     *
     * @return {Integer} unique hash code of the object
     */
    toHashCode : function() {
      return this.$$hash;
    },

    /**
     * Returns true if the object is disposed.
     *
     * @return {Boolean} Whether the object has been disposed
     */
    isDisposed: function() {
      return !!this.__disposed;
    },

    /**
     * Sends request.
     *
     * Relies on set before:
     * * a HTTP method
     * * an URL
     * * optional request headers
     * * optional request data
     */
    send: function() {
      var hasRequestData = (this.getRequestData() !== null),
          isBodyForMethodAllowed = qx.util.Request.methodAllowsRequestBody(this.getMethod()),
          curContentType = this.getRequestHeader("Content-Type"),
          serializedData = this._serializeData(this.getRequestData(), curContentType);

      // add GET params if needed
      if (this.getMethod() === "GET" && hasRequestData) {
        this.setUrl(qx.util.Uri.appendParamsToUrl(this.getUrl(), serializedData));
      }

      // initialize request
      this._transport.open(this.getMethod(), this.getUrl(), true);

      // set all previously stored headers on initialized request
      for (var key in this.__requestHeaders) {
        this._transport.setRequestHeader(key, this.__requestHeaders[key]);
      }

      // send
      if (!isBodyForMethodAllowed) {
        // GET & HEAD
        this._transport.send();
      } else {
        // POST & PUT ...
        if (typeof curContentType === "undefined") {
          // by default, set content-type urlencoded for requests with body
          this._transport.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        }

        this._transport.send(serializedData);
      }
    },

    /**
     * Aborts request.
     *
     * Cancels any network activity.
     * @return {qx.bom.request.SimpleXhr} Self for chaining.
     */
    abort: function() {
      this._transport.abort();
      return this;
    },

    /**
     * Disposes object and wrapped transport.
     * @return {Boolean} <code>true</code> if the object was successfully disposed
     */
    dispose: function() {
      if (this._transport.dispose()) {
        this.__parser = null;
        this.__disposed = true;
        return true;
      }
      return false;
    },

    /*
    ---------------------------------------------------------------------------
      PROTECTED
    ---------------------------------------------------------------------------
    */

    /**
     * Holds transport.
     */
    _transport: null,

    /**
     * Creates XHR transport.
     *
     * May be overriden to change type of resource.
     * @return {qx.bom.request.IRequest} Transport.
     */
    _createTransport: function() {
      return new qx.bom.request.Xhr();
    },

    /**
     * Registers common listeners on given transport.
     *
     * @param transport {qx.bom.request.IRequest} Transport.
     * @return {qx.bom.request.IRequest} Transport.
     */
    _registerTransportListener: function(transport) {
      transport.onreadystatechange = qx.lang.Function.bind(this._onReadyStateChange, this);
      transport.onloadend = qx.lang.Function.bind(this._onLoadEnd, this);
      transport.ontimeout = qx.lang.Function.bind(this._onTimeout, this);
      transport.onerror = qx.lang.Function.bind(this._onError, this);
      transport.onabort = qx.lang.Function.bind(this._onAbort, this);
      return transport;
    },

    /**
     * Creates response parser.
     *
     * @return {qx.util.ResponseParser} parser.
     */
    _createResponseParser: function() {
        return new qx.util.ResponseParser();
    },

    /**
     * Sets the response.
     *
     * @param response {String} The parsed response of the request.
     */
    _setResponse: function(response) {
      this.__response = response;
    },

    /**
     * Serializes data.
     *
     * @param data {String|Map} Data to serialize.
     * @param contentType {String?} Content-Type which influences the serialisation.
     * @return {String|null} Serialized data.
     */
    _serializeData: function(data, contentType) {
      var isPost = this.getMethod() === "POST",
          isJson = (/application\/.*\+?json/).test(contentType),
          serializedData = "";

      if (!data) {
        return null;
      }

      if (qx.lang.Type.isString(data)) {
        return data;
      }

      if (qx.lang.Type.isObject(data)) {
        serializedData = (isJson) ? qx.lang.Json.stringify(data)
                                  : qx.util.Uri.toParameter(data, isPost);
        return serializedData;
      }
    },

    /*
    ---------------------------------------------------------------------------
      PRIVATE
    ---------------------------------------------------------------------------
    */

    /**
     * {Array} Request headers.
     */
    __requestHeaders: null,
    /**
     * {Object} Request data (i.e. body).
     */
    __requestData: null,
    /**
     * {String} HTTP method to use for request.
     */
    __method: "",
    /**
     * {String} Requested URL.
     */
    __url: "",
    /**
     * {Object} Response data.
     */
    __response: null,
    /**
     * {Function} Parser.
     */
    __parser: null,
    /**
     * {Boolean} Whether object has been disposed.
     */
    __disposed: null,

    /*
    ---------------------------------------------------------------------------
      EVENT HANDLING
    ---------------------------------------------------------------------------
    */

    /**
     * Adds an event listener for the given event name which is executed only once.
     *
     * @param name {String} The name of the event to listen to.
     * @param listener {Function} The function to execute when the event is fired
     * @param ctx {var?} The context of the listener.
     * @return {qx.bom.request.Xhr} Self for chaining.
     */
    addListenerOnce: function(name, listener, ctx) {
      this._transport._emitter.once(name, listener, ctx);
      return this;
    },

    /**
     * Handles "readyStateChange" event.
     */
    _onReadyStateChange: function() {
      if (qx.core.Environment.get("qx.debug.io")) {
        qx.Bootstrap.debug("Fire readyState: " + this._transport.readyState);
      }

      if (this.isDone()) {
        this.__onReadyStateDone();
      }
    },

    /**
     * Called internally when readyState is DONE.
     */
    __onReadyStateDone: function() {
      if (qx.core.Environment.get("qx.debug.io")) {
        qx.Bootstrap.debug("Request completed with HTTP status: " + this._transport.status);
      }

      var response = this._transport.responseText;
      var contentType = this._transport.getResponseHeader("Content-Type");

      // Successful HTTP status
      if (qx.util.Request.isSuccessful(this._transport.status)) {

        // Parse response
        if (qx.core.Environment.get("qx.debug.io")) {
          qx.Bootstrap.debug("Response is of type: '" + this.getResponseContentType() + "'");
        }

        this._setResponse(this.__parser.parse(response, contentType));

        this._transport._emit("success");

      // Erroneous HTTP status
      } else {

        try {
          this._setResponse(this.__parser.parse(response, contentType));
        } catch (e) {
          // ignore if it does not work
        }

        // A remote error failure
        if (this._transport.status !== 0) {
          this._transport._emit("fail");
        }
      }
    },

    /**
     * Handles "loadEnd" event.
     */
    _onLoadEnd: function() {
      this._transport._emit("loadEnd");
    },

    /**
     * Handles "abort" event.
     */
    _onAbort: function() {
      this._transport._emit("abort");
    },

    /**
     * Handles "timeout" event.
     */
    _onTimeout: function() {
      this._transport._emit("timeout");

      // A network error failure
      this._transport._emit("fail");
    },

    /**
     * Handles "error" event.
     */
    _onError: function() {
      this._transport._emit("error");

      // A network error failure
      this._transport._emit("fail");
    }

  }
});
