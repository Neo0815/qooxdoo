/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007 David Pérez Carmona

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * David Perez Carmona (david-perez)

************************************************************************ */

/**
 * A popup that can be resized.
 */
qx.Class.define("qx.ui.resizer.ResizeablePopup",
{
  extend   : qx.ui.popup.Popup,
  include  : qx.ui.resizer.MResizeable,
  implement: qx.ui.resizer.IResizeable,

  construct : function()
  {
    this.base(arguments);

    this.initMinWidth();
    this.initMinHeight();
    this.initWidth();
    this.initHeight();
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties:
  {
    appearance :
    {
      refine : true,
      init : "resizer"
    },

    minWidth :
    {
      refine : true,
      init : "auto"
    },

    minHeight :
    {
      refine : true,
      init : "auto"
    },

    width :
    {
      refine : true,
      init : "auto"
    },

    height :
    {
      refine : true,
      init : "auto"
    }
  },






  members:
  {
    /*
    ---------------------------------------------------------------------------
      IResizeable interface
    ---------------------------------------------------------------------------
    */

    _changeWidth: function(value) {
      this.setWidth(value);
    },

    _changeHeight: function(value) {
      this.setHeight(value);
    },

    _getResizeParent: function() {
      return this.getParent();
    },

    _getMinSizeReference: function() {
      return this;
    }
  }
});
