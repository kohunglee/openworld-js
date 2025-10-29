/**
 * 当光标选中书时的事件
 */

const bookHot = {

    typeMap : {
        2: 3,
        3: 4,
        4: 5,
        5: 5
    },

    // 展示信息
    showInfo : (index) => {
        const args = k.indexToArgs.get(index);
        const book = args.book; if(book === undefined){return 0}
        console.log(book);
        const y = args.Y;
        const shelfId = book._shelf;
        let bookIndex = book._index;

        if(!book) {return 0}

        let tp;  // 通过线索，解决 TP，计算出 realIndex
        if (book._type === 1) {
            tp = y < 2 ? 2 : 1;
            bookIndex = bookIndex - 681;
        } else {
            tp = bookHot.typeMap[book._type];
        }
        const realIndex = testInShelf.firstFloorIndexTras(tp, bookIndex);

        if (shelfId === k.bookS.floor1.dire4[4]) {
            const data = testInShelf.floor1dire4_4(realIndex);
            const buildInfoHTML = arr => `
                <table border="1" cellspacing="0" cellpadding="4">
                <tr><th align="right">排名</th><td>${arr[0]}</td></tr>
                <tr><th align="right">网站</th><td><a href="https://${arr[1]}" target="_blank">${arr[1]}</a></td></tr>
                <tr><th align="right">名称</th><td>${arr[2]}</td></tr>
                <tr><th align="right">英文</th><td>${arr[3]}</td></tr>
                <tr><th align="right">简介</th><td>${arr[4]}</td></tr>
                <tr><th align="right">类型</th><td>${arr[5]}</td></tr>
                </table>
                `;

            document.getElementById('bookInfoLT').innerHTML = buildInfoHTML(data);

        }

    }
}