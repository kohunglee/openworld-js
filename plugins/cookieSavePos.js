/**
 * cookie 保存/还原 位置（主角的位置）
 * ========
 */

export default function(ccgxkObj){
    const pageKey = 'lastPos_mvp_' + location.pathname.replace(/\//g, '_');  // 页面不串 cookie
    
    /**
     * 只允许真正可用的数字进入位置快照。
     * 这里专门拦住 null / undefined / NaN / Infinity，避免污染 cookie。
     */
    function isValidNum(num) {
        return typeof num === 'number' && Number.isFinite(num);
    }

    /**
     * 生成当前角色的健康快照。
     * 只要位置三轴里有一个坏掉，这一轮就直接放弃保存。
     */
    function getSafePoseSnapshot() {
        const mvp = ccgxkObj?.mainVPlayer;
        const mPos = mvp?.body?.position;
        if (!mPos) return null;
        if (!isValidNum(mPos.x) || !isValidNum(mPos.y) || !isValidNum(mPos.z)) return null;

        return {
            x: mPos.x,
            y: mPos.y,
            z: mPos.z,
            rX: isValidNum(mvp?.rX) ? mvp.rX : 0,
            rY: isValidNum(ccgxkObj?.keys?.turnRight) ? ccgxkObj.keys.turnRight : 0,
            rZ: isValidNum(mvp?.rZ) ? mvp.rZ : 0,
        };
    }

    // 一秒执行一次
    setInterval(() => {
        if(ccgxkObj?.isMVPInit !== true){ return 0 }
        const safePose = getSafePoseSnapshot();
        if (!safePose) return 0;

        // 只有健康快照才允许写入 cookie，同时把内存中的 lastPos 同步成最新安全点。
        setObjectCookie(pageKey, safePose);
        ccgxkObj.lastPos = safePose;
    }, 1000)

    // 存储对象到Cookie
    function setObjectCookie(name, obj, days) {
        const value = encodeURIComponent(JSON.stringify(obj));
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days*24*60*60*1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = `${name}=${value}${expires}; path=/`;
    }

    // 从 Cookie 读取对象
    function getObjectCookie(name) {
        const cookieArr = document.cookie.split('; ');
        for(let i = 0; i < cookieArr.length; i++) {
            const cookiePair = cookieArr[i].split('=');
            if(name === cookiePair[0]) {
                return JSON.parse(decodeURIComponent(cookiePair[1]));
            }
        }
        return null;
    }
    ccgxkObj.lastPos = getObjectCookie(pageKey);
}
