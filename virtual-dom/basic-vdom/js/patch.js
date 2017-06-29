var REPLACE = 0; // 替换
var REORDER = 1; // 移动
var PROPS = 2; // 属性
var TEXT = 3; // 文本

// 深度优先遍历
// patches 记录每一级的dom差异
function patch(node, patches) {
  var walker = {
    index: 0
  }
  dfsWalk(node, walker, patches);
}

function dfsWalk(node, walker, patches) {
  // 从patches拿出当前节点的差异
  var currentPatches = patches[walker.index];
  var len = node.childNodes ? node.childNodes.length : 0;
  for(var i = 0; i < len; i++) {
    var child = node.childNodes[i];
    walker.index++;
    dfsWalk(child, walker, patches);
  }

  if(currentPatches) {
    // 根据不同类型的差异对当前节点进行操作
    applyPatches(node, currentPatches);
  }
}

function applyPatches(node, currentPatches) {
  _.each(currentPatches, function(currentPatch) {
    switch (currentPatch.type) {
      case REPLACE:
      var newNode = (typeof currentPatch.node === 'string')
      ? document.createTextNode(currentPatch.node)
      : currentPatch.node.render();
      node.parentNode.replaceChild(newNode, node);
      break;
      case REORDER:
      reorderChildren(node, currentPatch.moves);
      break;
      case PROPS:
      setProps(node, currentPatch.props);
      break;
      case TEXT:
      if(node.textContent) {
        node.textContent = currentPatch.content;
      } else {
        // ie
        node.nodeValue = currentPatch.content;
      }
      break;
      default:
      throw new Error('Unknown patch type' + currentPatch.type);
    }
  })
};


// 设置属性
function setProps(node, props) {
  for(var key in props) {
    if(props[key] === void 666) {
      node.removeAttribute(key);
    } else {
      var value = props[key];
      _.setAttr(node, key, value);
    }
  }
}


// 移动元素
function reorderChildren(node, moves) {
 var staticNodeList = _.toArray(node.childNodes);
 // map 存储dom节点，以key-node形式
 var maps = {};


  _.each(staticNodeList, function(node) {
    // 如果是元素节点
    if(node.nodeType === 1) {
      var key = node.getAttribute('key');
      if(key) {
        maps[key] = node;
      }
    }
  });

  _.each(moves, function(move) {
    var index = move.index;
    // type = 0 删除，= 1 增加
    if(move.type === 0) {
      // 可能是为了插入而移除的
      if(staticNodeList[index] === node.childNodes[index]) {
        // 本来就相等为什么还要条件判断？因为childNodes是动态变化的，删除或者增加都会变化，所以要判断是否跟最开始的值是否相等
        node.removeChild(node.childNodes[index]);
      }

    } else if(move.type === 1) {
      var insertNode = maps[move.item.key] ? maps[move.item.key]
      : (typeof move.item === 'object') ? move.item.render()
      : document.createTextNode(move.item);
      // 数组及node节点插入节点
      staticNodeList.splice(index, 0, insertNode);
      node.insertBefore(insertNode, node.childNodes[index] || null);
    }
  })
}

patch.REPLACE = REPLACE;
patch.REORDER = REORDER;
patch.PROPS = PROPS;
patch.TEXT = TEXT;