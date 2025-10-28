/**
 *  关于书架上书的文字，业务逻辑都在这个文件里了
 *  */

// 定义一个对象，用于将书架编号、书本编号，转化为其应该显示的字
const testInShelf = {

    // 翻译 Index 到真实的 Index（历史遗留问题，硬更改）
    firstFloorIndexTras : (tp, index) => {
        if(tp === 1){  // 一楼书架上层
            const shelfBlock =  index/31 | 0; // 和 31 的余数，方便定位书架
            switch (shelfBlock) {
                case 1:  index -= 30; break;
                case 0:  index += 31; break;
                case 2:  index -= 1;  break;
                case 3:  index -= 2;  break;
                case 4:  index -= 3;  break;
                case 5:  index += (index <= 158 ? -3 : -4); break;
                case 6:  index -= 5;  break;
                case 7:  index -= 6;  break;
                case 8:  index -= 7;  break;
                case 9:  index -= 8;  break;
                case 10: index -= 9;  break;
                case 11: index += (index <= 344 ? -9 : -10); break;
                case 12: index -= 11; break;
                case 13: index -= 12; break;
                case 14: index -= 13; break;
                case 15: index -= 14; break;
                case 16: index -= 15; break;
                case 17: index += (index <= 530 ? -15 : -16); break;
                case 18: index -= 17; break;
                case 19: index -= 18; break;
                case 20: index -= 19; break;
                case 21: index += (index <= 654 ? -19 : -20); break;
            }
        }

        if(tp === 2){  // 一楼书架下层
            const shelfBlock =  index/31 | 0; // 和 31 的余数，方便定位书架
            switch (shelfBlock) {
                case 1:  index -= 1; break;
                case 2:  index -= 2; break;
                case 3:  index -= 3;  break;
                case 4:  index -= 4;  break;
                case 5:  index += (index <= 159 ? -4 : -5); break;
                case 6:  index -= 6;  break;
                case 7:  index -= 7;  break;
                case 8:  index -= 8;  break;
                case 9:  index -= 9;  break;
                case 10: index -= 10; break;
                case 11: index += (index <= 345 ? -10 : -11); break;
            }
            index += 660;
        }

        if(tp === 3){  // 二楼书架统一书架
            const shelfBlock =  index/36 | 0; // 和 31 的余数，方便定位书架
            const pos = shelfBlock % 5;
            switch (pos) {
                case 0: index += 71; break;
                case 1: index += 70; break;
                case 2: index += 69; break;
                case 3: index -= 107; break;
                case 4: index -= 108; break;
            }
        }

        if(tp === 4){  // 二楼、长书架
            const shelfBlock =  index/31 | 0; // 和 31 的余数，方便定位书架
            if(shelfBlock <= 34){
                const pos = shelfBlock % 5;
                const group = shelfBlock / 5 | 0;
                switch (pos) {
                    case 0: index += 91; break;
                    case 1: index += 90; break;
                    case 2: index += 89; break;
                    case 3: index -= 62; break;
                    case 4: index -= 63; break;
                }
                index += 25 * group;  // 因为靠右，所以还要加上这个偏移
            } else {  // 最左边那一列
                const off = shelfBlock - 35;
                index -= 1084-(149*off)
                index = index;
            }
        }

        if(tp === 5){  // 二楼、廊柜
            const shelfBlock =  index/36 | 0; // 和 31 的余数，方便定位书架
            const pos = shelfBlock % 3;
            const group = shelfBlock / 3 | 0;
            switch (pos) {
                case 0: index += 36; break;
                case 1: index += 35; break;
                case 2: index -= 71; break;
            }
            index -= 3 * group;  // 因为靠右，所以还要加上这个偏移
        }
        return index;
    },

    // 返回应有的文字
    returnBook : (shelfId, index, tp) => {
        const realIndex = testInShelf.firstFloorIndexTras(tp, index);  // 获取真实 Index （在书架上的真实位置）
        return realIndex;
    }
}