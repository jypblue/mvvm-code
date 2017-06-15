
/**
 * patch from patch.js
 * _ from utils.js
 * listDiff from list-diff.js
 */


function diffProps(oldNode, newNode) {
  var count = 0; // 标记有多少不同的属性
  var oldProps = oldNode.props;
  var newProps = newNode.props;
  var key, value;
  var propsPatches = {};
  // 找到不同的属性
  for(key in oldProps) {
    value = oldProps[key];
    if(newProps[key] !== value) {
      count++;
      propsPatches[key] = newProps[key];
    }
  }

  // 找到新属性
  for(key in newProps) {
    value = newProps[key];// ?
    if(!oldProps.hasOwnProperty(key)) {
      count++;
      propsPatches[key] = newProps[key];
    }
  }

  // 如果属性都相同
  if(count === 0) {
    return null;
  }

  return propsPatches;
};

function isIgnoreChildren(node) {
  return (node.props && node.props.hasOwnProperty('ignore'));
}

function diffChildren(oldChildren, newChildren, index, patches, currentPatch) {
  var diffs = listDiff(oldChildren, newChildren, 'key');
  newChildren = diffs.children;

  if(diffs.moves.length) {
    var reorderPatch = { type: patch.REORDER, moves: diffs.moves}
    currentPatch.push(reorderPatch);
  }

  var leftNode = null;
  var currentNodeIndex = index;
  _.each(oldChildren, function(child, i) {
    var newChild = newChildren[i];
    currentNodeIndex = (leftNode && leftNode.count)
    ? currentNodeIndex + leftNode.count + 1
    : currentNodeIndex + 1;
    // 递归调用， index按照是否有子节点累加
    diffDfsWalk(child, newChild, currentNodeIndex, patches);
    leftNode = child;
  })

}



function diff(oldTree, newTree) {
  var index = 0;
  var patches = {};
  diffDfsWalk(oldTree, newTree, index, patches);
  return patches;
}


function diffDfsWalk(oldNode, newNode, index, patches) {
  var currentPatch = [];

  // 节点已经被移除了
  if(newNode === null) {
    // 真正的DOM节点将被删除时，执行重新排序，所以不需要在这里做任何事
  } else if(_.isString(oldNode) && _.isString(newNode)) {
    //如果都是String说明是TextNode类型则 替换TextNode content
    if(newNode !== oldNode) {
      currentPatch.push({
        type: patch.TEXT, content: newNode
      });
    }
  } else if(
    oldNode.tagName === newNode.tagName &&
    oldNode.key === newNode.key
  ) {
    // 如果节点一样，就比较节点的属性和子节点差异

    // 比较属性
    var propsPatches = diffProps(oldNode, newNode);
    if(propsPatches) {
      currentPatch.push({
        type: patch.PROPS,
        props: propsPatches
      })
    }

    // 比较子节点
    // 如果有'ignore'属性，就不比较
    if(!isIgnoreChildren(newNode)) {
      diffChildren(
        oldNode.children,
        newNode.children,
        index,
        patches,
        currentPatch
      )
    }

  } else {
    // 节点都不同，就直接替换成新节点
    currentPatch.push({
      type: patch.REPLACE,
      node: newNode
    })
  }

  if(currentPatch.length) {
    patches[index] = currentPatch;
  }

}