export { initDragElement, initResizeElement };
/**
 * @see https://wow.techbrood.com/fiddle/59637
 */
function initDragElement({ content, header }) {
  if (!content) {
    return;
  }
  if (!header) {
    return;
  }
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  var elmnt = null;
  var currentZIndex = 100; //TODO reset z index when a threshold is passed

  // console.log('header', header);
  if (header) {
    header.style.cursor = 'move';
  }

  content.onmousedown = function() {
    this.style.zIndex = '' + ++currentZIndex;
  };

  header.parentPopup = content;
  header.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    elmnt = this.parentPopup;
    elmnt.style.zIndex = '' + ++currentZIndex;

    e = e || window.event;
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    if (!elmnt) {
      return;
    }

    e = e || window.event;
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = elmnt.offsetTop - pos2 + 'px';
    elmnt.style.left = elmnt.offsetLeft - pos1 + 'px';
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
/**
 * @see https://wow.techbrood.com/fiddle/59637
 */
function initResizeElement({ content }) {
  var element = null;
  var startX, startY, startWidth, startHeight;
  [
    // 右，东
    {
      width: '16px',
      height: '100%',
      right: '-8px',
      bottom: 0,
      cursor: 'e-resize',
    },
    // 下，南
    {
      width: '100%',
      height: '16px',
      right: 0,
      bottom: '-8px',
      cursor: 's-resize',
    },
    // 右下，东南
    {
      width: '24px',
      height: '24px',
      right: '-12px',
      bottom: '-12px',
      cursor: 'se-resize',
    },
  ].forEach(function(style) {
    var element = document.createElement('div');
    element.style.cssText = `
    background: transparent;
    position: absolute;
    `;
    Object.assign(element.style, style);
    content.appendChild(element);
    element.addEventListener('mousedown', initDrag, false);
    element.parentPopup = content;
  });

  function initDrag(e) {
    element = this.parentPopup;

    startX = e.clientX;
    startY = e.clientY;
    startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
    startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
    document.documentElement.addEventListener('mousemove', doDrag, false);
    document.documentElement.addEventListener('mouseup', stopDrag, false);
  }

  function doDrag(e) {
    element.style.width = startWidth + e.clientX - startX + 'px';
    element.style.height = startHeight + e.clientY - startY + 'px';
  }

  function stopDrag() {
    document.documentElement.removeEventListener('mousemove', doDrag, false);
    document.documentElement.removeEventListener('mouseup', stopDrag, false);
  }
}
