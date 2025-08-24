/**
 * cookie 保存/还原 位置（主角的位置）
 * ========
 */

export default function(ccgxkObj){
    // 一秒执行一次
    setInterval(() => {
        if(ccgxkObj?.isMVPInit !== true){ return 0 }
        const mvp = ccgxkObj.mainVPlayer;
        const mPos = mvp.body.position;  //+2 储存主角的位置到 COOKIE
        setObjectCookie('lastPos_mvp', {
            x: mPos.x, y: mPos.y, z: mPos.z,
            rX: mvp.rX, rY:mvp.rY, rZ:mvp.rZ,  // 暂时不研究了，好像没法储存选择
        }); // 存储对象到Cookie
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
    ccgxkObj.lastPos = getObjectCookie('lastPos_mvp');
}