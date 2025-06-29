/**
 * 这是通用的 JS 钩子，在 WJS CANNON CCGXK 里都有引入
 */
export default {
    _hookQueues: new Map(), // 任务队列

    // 注册事件
    on(hookName, callbackFunction, priority = 100) {
      if (typeof callbackFunction !== 'function') throw new TypeError('Callback must be function');
      const queue = this._hookQueues.get(hookName) || [];
      queue.push({ func: callbackFunction, priority: priority });
      queue._isSorted = false;  //+1 标记队列为未排序，并加入【任务列表】
      this._hookQueues.set(hookName, queue);
    },

    // 注销事件
    off(hookName, callbackFunction) {
      const queue = this._hookQueues.get(hookName); if (!queue) return;
      const filteredQueue = queue.filter(item => item.func !== callbackFunction);  // 删掉指定任务
      if (filteredQueue.length === 0) this._hookQueues.delete(hookName); // 如果队列为空，直接删除这个 hookName，释放内存
      else if (filteredQueue.length < queue.length) { filteredQueue._isSorted = false; this._hookQueues.set(hookName, filteredQueue); } // 更新队列，标记为未排序
    },

    // 排序
    _getSortedCallbacks(hookName) {
      let queue = this._hookQueues.get(hookName); if (!queue) return [];
      if (!queue._isSorted) { queue.sort((a, b) => b.priority - a.priority); queue._isSorted = true; } // 排序后，标记为已排序（只排序一次）
      return [...queue];
    },

    // 异步触发
    async emit(hookName, ...args) {
      const callbacks = this._getSortedCallbacks(hookName).map(item => item.func);
      const promises = callbacks.map(async callback => { // 为每个“监听者”创建一个异步执行的Promise
        try { return await callback(...args); } catch (errorReason) {
          console.error(`[Async]Hook ${hookName} error:`, errorReason);
          throw errorReason; 
        } });
      return Promise.allSettled(promises);
    },

    // 同步触发
    emitSync(hookName, ...args) {
      const results = []; // 用于收集执行结果
      for (const { func } of this._getSortedCallbacks(hookName)) {
        try {
          const returnValue = func(...args);
          results.push({ status: 'fulfilled', value: returnValue });
          if (returnValue === false) break;  // 返回假，中断
        }
        catch (errorReason) {
          console.error(`[Sync]Hook ${hookName} error:`, errorReason);
          results.push({ status: 'rejected', reason: errorReason }); 
        }
      }
      return results;
    },
}

/**

使用文档：

欢迎来到你的“调度中心”！它像一位高效的秘书，负责精准地“广播消息”，并按“座次”安排“听众”执行任务。它有两种广播方式：即时反馈的“同步广播”，和不催促结果的“异步广播”。

1. 邀请听众 (on)
指令： on(hookName, callbackFunction, priority = 100)
作用： 这是你的“邀请函”。它邀请一位“听众”（callbackFunction，必须是函数）来“监听”某个特定“话题”（hookName，即事件名）。
你可以给他安排一个“座次”（priority），数字越大，座次越靠前，发言（执行）越优先。

2. 送走听众 (off)
指令： off(hookName, callbackFunction)
作用： 如果这位“听众”不想再“听”这个话题了，或你不再需要他，就用这个指令“礼貌地请他离开”。

3. 同步广播 (emitSync)
指令： emitSync(hookName, ...args)
作用： 发出“即时通知”，所有注册的“听众”会按“座次”挨个发言。你必须等所有人都说完，才能进行下一步。
中断机制： 任何一位“听众”如果返回 false，就像举起了“一票否决权”，后续的“听众”将不再发言，流程立即停止。
回报： 广播结束后，你会收到一份完整的“会议纪要”，记录了每位听众的“发言结果”（value）或“错误”（reason）。

4. 异步广播 (emit)
指令： emit(hookName, ...args)
作用： 发出“非阻塞通知”。所有“听众”会同时开始处理任务（即使它们是异步的），你无需等待他们完成，可以继续做自己的事。
并行： 这就像给所有听众布置了任务，他们各自去忙，你不需要等待谁。
回报： 你会立即拿到一份“承诺书”（Promise.allSettled的结果），它会告诉你所有“听众”的任务最终是成功还是失败。即使有人失败，其他人也会继续努力。

总结：
on / off： 你的“人事管理”工具，安排和撤销“听众”。
emitSync： 适用于需要立即反馈、按序执行、且可以“一票否决”的“紧急会议”或数据处理。
emit： 适用于那些可以并行处理、耗时较长、不阻塞主流程的“后台任务”或外部集成。
合理运用，让你的代码流程“井然有序，高效运转”。
 */