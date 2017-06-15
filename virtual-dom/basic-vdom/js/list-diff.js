
/**
 *
 * Convert list to key-item keyindex Object.
 * @param {Array} list
 * @param {String|Function} key
 */
function makeKeyIndexAndFree(list, key) {
  var keyIndex = {};
  var free = [];
  for(var i = 0, len = list.length; i < len; i++) {
    var item = list[i];
    var itemKey = getItemKey(item, key);
    if(itemKey) {
      keyIndex[itemKey] = i ;
    } else {
      free.push(item);
    }
  }
  return {
    keyIndex: keyIndex,
    free: free
  }
}

function getItemKey(item, key) {
  if(!item || !key) return void 666;
  return typeof key === 'string' ? item[key] : key(item);
}



/**
 * Diff two list in O(n)
 *
 * @param {Array} oldList
 * @param {Array} newList
 * @param {Object} key
 */
function listDiff(oldList, newList, key) {
  // 获得keyIndex及free对象集合
  var oldMap = makeKeyIndexAndFree(oldList, key);
  var newMap = makeKeyIndexAndFree(newList, key);

  // 数组
  var newFree = newMap.free;
  var oldKeyIndex = oldMap.keyIndex;
  var newKeyIndex = newMap.keyIndex; // keyIndex对象

  var moves = [];

  // 操作的模拟列表
  var children = [];
  var i = 0;
  var item = null;
  var itemKey = null;
  var freeIndex = 0;

  // 第一步检查旧列表中的项：是否删除了
  // 循环获取旧列表的item项，看是否能获取到key，如果能获取到，如果在新列表中有这个key对应的项，
  // 就存入children数组中，否则存入null,如果没有，就存入新列表中的从头开始的选项
  // 注意： 有key就可以直接取到，节约时间，没有key就会从头开始循环遍历
  while( i < oldList.length) {
    item = oldList[i];
    itemKey = getItemKey(item, key);
    if(itemKey) {
      if(!newKeyIndex.hasOwnProperty(itemKey)) {
        children.push(null);
      } else {
        var newItemIndex = newKeyIndex[itemKey];
        children.push(newList[newItemIndex]);
      }
    } else {
      var freeItem = newFree[freeIndex++];
      children.push(freeItem || null);
    }
    i++;
  }

  // 复制children后赋值给simulateList
  // simulateList是从oldList中选出跟newList有相同key的item集合
  var simulateList = children.slice(0);

  // 去除不在存在的选项
  i = 0;
  while( i < simulateList.length) {
    if(simulateList[i] === null) {
      remove(i);
      removeSimulate(i);
    } else {
      i++;
    }
  }

  // i是在newlist中指向某个选项的游标
  // j是在simulateList中指向某个选项的游标
  var j = i = 0;
  while(i < newList.length) {
    item = newList[i];
    itemKey = getItemKey(item,key);

    var simulateItem = simulateList[j];
    var simulateitemKey = getItemKey(simulateItem, key);

    if(simulateItem) {
      // 如果在新的Dom list中存在与旧的Dom的相同的key
      if(itemKey === simulateitemKey) {
        j++;
      } else {
        // 否则就是新的item，就插入其中
        if(!oldKeyIndex.hasOwnProperty(itemKey)) {
          insert(i, item);
        } else {
          // 如果旧的key等于新list后一位的key，则移除当前simulateItem,使simulateList中item在正确的位置
          var nextItemKey = getItemKey(simulateList[j+1],key);
          if(nextItemKey === itemKey) {
            remove(i);
            removeSimulate(j);
            j++
          } else {
            insert(i, item);
          }
        }
      }
    } else {
      insert(i, item);
    }
    i++;
  }

  // 如果j没有移除到最后，则删除oldList所有其余项
  var k = 0;
  while( j++ < simulateList.length) {
    remove(k+i);
    k++;
  }


  function remove(index) {
    // index 位置， type删除(0)还是插入(1)
    var move = {
      index: index,
      type: 0
    }
    moves.push(move);
  }

  /**
   * @param {Number} index  插入位置
   * @param {Object} item   插入选项
   */
  function insert(index, item) {
    var move = {
      index: index,
      item: item,
      type: 1
    }
    moves.push(move)
  }

  function removeSimulate(index) {
    simulateList.splice(index, 1);
  }


  return {
    moves: moves,
    children: children
  }

}