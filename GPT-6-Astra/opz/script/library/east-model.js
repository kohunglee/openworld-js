// MINI LIBRARY · 18 × 15 × 8.5 m, exactly 1/8 of DEV002's 36 × 30 × 17 m proxy.
// World coordinates use the upstream metre scale. No engine or plugin changes.
export const EAST_LIBRARY = {x:32,z:-25,width:18,depth:15,height:8.5,ground:.65,upper:4.75,roof:9,budget:300000};
export const P={chalk:'#e1d7be',paper:'#eadfbf',edge:'#d5c6a4',oak:'#ad7540',oak2:'#84542f',
    walnut:'#473222',dark:'#183432',teal:'#215450',green:'#416a53',gold:'#be924d',
    red:'#9c4540',blue:'#45607a',stone:'#747d73',mortar:'#3c5149',black:'#242b29',light:'#ffdf91'};
const covers=['#315850','#9a443b','#b48943','#37576e','#75613f','#695471','#587657','#69362e'];
const glyphs={A:['010','101','111','101','101'],B:['110','101','110','101','110'],C:['011','100','100','100','011'],
 D:['110','101','101','101','110'],E:['111','100','110','100','111'],F:['111','100','110','100','100'],
 G:['011','100','101','101','011'],H:['101','101','111','101','101'],I:['111','010','010','010','111'],
 J:['001','001','001','101','010'],K:['101','101','110','101','101'],L:['100','100','100','100','111'],
 M:['101','111','111','101','101'],N:['101','111','111','111','101'],O:['010','101','101','101','010'],
 P:['110','101','110','100','100'],Q:['010','101','101','111','011'],R:['110','101','110','101','101'],
 S:['011','100','010','001','110'],T:['111','010','010','010','010'],U:['101','101','101','101','111'],
 V:['101','101','101','101','010'],W:['101','101','111','111','101'],X:['101','101','010','101','101'],
 Y:['101','101','010','010','010'],Z:['111','001','010','100','111'],'0':['111','101','101','101','111'],
 '1':['010','110','010','010','111'],'2':['110','001','010','100','111']};
const titles=['DUNE','DARK','LEAF','TIME','WIND','MIND','STAR','BLUE','WAVE','TREE','ARTS','LIFE','HOME','MATH','BIRD','READ'];
const noise=(n)=>{let v=Math.imul(n+1,1597334677);v^=v>>>16;return (v>>>0)/4294967296;};
function writer(list,transform={x:0,y:0,z:0,ry:0}){
    const a=transform.ry*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
    return (x,y,z,w,h,d,b=P.oak,rot=0)=>{
        const q={x:EAST_LIBRARY.x+transform.x+x*c+z*s,y:transform.y+y,z:EAST_LIBRARY.z+transform.z-x*s+z*c,w,h,d,b};
        if(rot+transform.ry)q.ry=rot+transform.ry;
        list.push(q);return q;
    };
}
function word(B,text,x,y,z,size=.08,color=P.gold){
    const start=x-(text.length*4-1)*size/2;
    [...text].forEach((ch,i)=>{(glyphs[ch]||[]).forEach((row,r)=>{[...row].forEach((v,j)=>{
        if(v==='1')B(start+(i*4+j)*size,y+(4-r)*size,z,size*.84,size*.84,.012,color);
    });});});
}
// Long members describe structure. Small members describe joints, brass pins,
// carved edges, upholstery seams and bookbinding. All geometry is cuboid.
export function makeEastLibraryPlan(){
    const groups={shell:[],facade:[],landscape:[],lower:[],upper:[],shelves0:[],shelves1:[],glass:[]};
    const colliders=[],bays=[];let list=groups.shell,B=writer(list);
    const use=name=>{list=groups[name];B=writer(list);};
    function solid(x,y,z,w,h,d,b=P.oak,ry=0){
        const q=B(x,y,z,w,h,d,b,ry);colliders.push({...q});return q;
    }
    const collision=(x,y,z,w,h,d,ry=0)=>colliders.push({X:EAST_LIBRARY.x+x,Y:y,Z:EAST_LIBRARY.z+z,width:w,height:h,depth:d,ry});
    function balustrade(x,y,z,len,axis='x'){
        const along=axis==='x';
        B(x,y+1.04,z,along?len:.08,.07,along?.08:len,P.oak2);
        B(x,y+.1,z,along?len:.07,.07,along?.07:len,P.dark);
        for(let t=-len/2;t<=len/2;t+=.15)B(x+(along?t:0),y+.54,z+(along?0:t),.025,.93,.025,P.gold);
        collision(x,y+.55,z,along?len:.12,1.1,along?.12:len);
    }
    // A quiet masonry envelope opens south and east; north and west are books.
    solid(0,.56,0,18,.18,15,P.dark);
    solid(0,.62,0,17.6,.06,14.6,P.oak);
    solid(0,4.72,-7.37,18,8.46,.26,P.chalk);
    solid(-8.87,4.72,0,.26,8.46,15,P.chalk);
    // Front: wide open entrance, deep reveals, clear upper and lower windows.
    for(const f of [0,1]){
        const y=.65+f*4.1;
        for(const x of [-8.76,-5.8,-2.7,2.7,5.8,8.76])solid(x,y+1.95,7.35,.22,3.9,.3,P.dark);
        for(const x of [-5.8,5.8])solid(x,y+.26,7.34,5.8,.52,.28,P.dark);
        solid(0,y+3.92,7.3,18,.25,.45,P.dark);
        for(const x of [-7.28,-4.25,4.25,7.28]){
            collision(x,y+1.96,7.37,2.75,2.9,.12);
            for(const z of [7.28,7.4])B(x,y+1.96,z,2.64,.045,.05,P.gold);
        }
        if(f===1){collision(0,y+1.8,7.37,5.2,3.6,.12);}
        else {B(0,y+3.1,7.38,5.2,.38,.12,P.dark);word(B,'FOLIO',0,y+3.03,7.47,.052,P.light);}
    }
    // East wall: tall reading windows and a sheltered stair viewed from outside.
    for(let z=-7.2;z<=7.21;z+=2.4)solid(8.85,4.7,z,.28,8.45,.17,P.dark);
    solid(8.82,.89,0,.22,.48,15,P.dark);
    solid(8.82,4.74,0,.28,.25,15,P.dark);
    solid(8.82,8.8,0,.28,.25,15,P.dark);
    collision(8.87,4.9,0,.12,7.8,14.8);
    // Mezzanine: five slabs preserve the atrium and the stair opening.
    solid(-5.6,4.64,0,6.4,.22,14.6,P.oak2);
    solid(3.55,4.64,.65,1.5,.22,12.1,P.oak2);
    solid(3.2,4.64,-4.9,11.2,.22,4.8,P.oak2);
    solid(.95,4.64,5.05,6.7,.22,2.5,P.oak2);
    solid(3.2,4.64,6.8,11.2,.22,1,P.oak2);
    // One continuous slab, flush with the north floor, clear of the stair landing.
    solid(6.55,4.64,-1.55,4.5,.22,1.9,P.oak2);
    // Roof is a ring, with a glazed 5.8 x 7.2m skylight over the double height room.
    solid(-5.9,8.89,0,6.2,.12,15,P.dark);
    solid(5.9,8.89,0,6.2,.12,15,P.dark);
    solid(0,8.89,-5.45,5.6,.12,4.1,P.dark);
    solid(0,8.89,5.7,5.6,.12,3.6,P.dark);
    for(const x of [-2.86,2.86])B(x,8.9,.15,.14,.2,7.2,P.gold);
    for(let z=-3.4;z<3.9;z+=1.2)B(0,8.9,z,5.6,.12,.12,P.gold);
    // Switchback stair. Each .1464m rise has a tread nose and fine wood boards.
    for(let j=0;j<14;j++){
        const top=.65+(j+1)*4.1/28,top2=.65+2.05+(j+1)*4.1/28;
        solid(5.25,top-.07,5.65-j*.38,1.9,.14,.4,P.oak);
        solid(7.45,top2-.07,.71+j*.38,1.9,.14,.4,P.oak);
        B(5.25,top+.006,5.8-j*.38,1.86,.012,.035,P.gold);
        B(7.45,top2+.006,.56+j*.38,1.86,.012,.035,P.gold);
        for(let t=0;t<9;t++){
            B(4.4+t*.21,top+.01,5.65-j*.38,.195,.018,.33,t%3===0?P.oak2:P.oak);
            B(6.6+t*.21,top2+.01,.71+j*.38,.195,.018,.33,t%3===0?P.oak2:P.oak);
        }
        for(const x of [4.22,6.33]){B(x,top+.49,5.65-j*.38,.035,1,.035,P.gold);B(x,top+.98,5.65-j*.38,.08,.07,.42,P.oak2);}
        for(const x of [6.38,8.5]){B(x,top2+.49,.71+j*.38,.035,1,.035,P.gold);B(x,top2+.98,.71+j*.38,.08,.07,.42,P.oak2);}
    }
    solid(6.35,2.64,.04,4.12,.12,1.05,P.oak);
    solid(6.35,4.69,6.37,4.12,.12,1.08,P.oak);
    balustrade(6.35,2.7,-.49,4.12);
    balustrade(-2.39,4.75,.65,6.3,'z');balustrade(2.79,4.75,.65,6.3,'z');
    balustrade(.2,4.75,-2.51,5.18);balustrade(.2,4.75,3.8,5.18);
    // Small physical stair side barriers use rectangles; micro rails are visual.
    collision(4.18,2.55,3,.08,3.8,5.8);collision(8.53,4.65,3,.08,3.8,5.8);
    // Structural edges in the void make the floor thickness legible.
    for(const x of [-2.43,2.83])B(x,4.46,.65,.08,.18,6.35,P.gold);
    for(const z of [-2.55,3.83])B(.2,4.46,z,5.3,.18,.08,P.gold);

    use('facade');
    // Individual staggered bricks, narrow mortar reveals and copper window fins.
    for(let row=0;row<31;row++){
        for(let j=0;j<36;j++){
            const x=-8.76+j*.5+(row%2)*.25;
            if(x<8.8)B(x,.79+row*.26,-7.515,.48,.242,.035,noise(row*41+j)>.5?P.chalk:P.edge);
        }
        for(let j=0;j<29;j++){
            const z=-7.2+j*.5+(row%2)*.25;
            B(-9.015,.79+row*.26,z,.035,.242,.48,noise(row*53+j)>.5?P.chalk:P.edge);
        }
    }
    for(let z=-6.95;z<7.2;z+=.29){
        B(8.98,6.62,z,.035,3.4,.045,P.gold);
        if(z<-1)B(8.98,2.56,z,.035,3.2,.045,P.gold);
    }
    // Striped entrance soffit; its timber end-grain is modelled rather than painted.
    for(let x=-3;x<=3;x+=.15){B(x,3.73,6.8,.115,.13,1.3,P.oak);B(x,3.65,7.35,.08,.018,.12,P.gold);}
    word(B,'FOLIO LIBRARY',0,8.04,7.53,.17,P.chalk);
    word(B,'READ',-7.3,1.4,7.55,.075,P.gold);
    for(const x of [-8.5,8.5])for(let y=1;y<8.7;y+=.4)B(x,y,7.53,.04,.1,.04,P.gold);
    // Roof ribbons and grooves; warm light strips are geometry, no new lights.
    for(const x of [-8.9,8.9]){B(x,8.62,0,.12,.07,15,P.light);B(x,8.76,0,.14,.06,15,P.gold);}
    for(const z of [-7.45,7.45]){B(0,8.62,z,18,.07,.12,P.light);B(0,8.76,z,18,.06,.14,P.gold);}

    function floorBoards(y,upper=false){
        for(let ix=0;ix<69;ix++)for(let iz=0;iz<13;iz++){
            const x=-8.63+ix*.25,z=-6.8+iz*1.08;
            const inVoid=x>-2.4&&x<2.8&&z>-2.5&&z<3.8;
            const inStairs=x>4.3&&z>-.5&&z<6.3;
            if(upper&&(inVoid||inStairs))continue;
            B(x,y+.008,z,.24,.016,1.065,[P.oak,P.oak,P.oak2,'#9c6d3e'][Math.floor(noise(ix*97+iz)*4)]);
            if((ix+iz)%5===0)B(x+.085,y+.019,z-.48,.007,.004,.015,P.dark);
        }
    }
    function chair(x,y,z,ry=0,color=P.teal){
        const local=[],S=writer(local,{x,y,z,ry});
        S(0,.5,0,.68,.17,.67,color);S(0,.87,-.27,.7,.65,.12,color);
        for(const dx of [-.26,.26])for(const dz of [-.23,.23])S(dx,.22,dz,.055,.44,.055,P.oak2);
        for(const dx of [-.37,.37]){S(dx,.72,0,.1,.1,.62,P.oak);S(dx,.59,.22,.035,.24,.035,P.gold);}
        // Seams on the cushion edge, small upholstery tufts and feet ferrules.
        for(let j=0;j<14;j++){
            S(-.29+j*.043,.59,.28,.022,.009,.012,P.edge);
            S(-.29+j*.043,1.1,-.198,.023,.009,.014,P.edge);
        }
        for(const dx of [-.17,.17])for(const dz of [-.15,.13])S(dx,.589,dz,.018,.012,.018,P.oak2);
        for(const dx of [-.26,.26])for(const dz of [-.23,.23])S(dx,.045,dz,.058,.085,.058,P.gold);
        list.push(...local);collision(x,y+.57,z,.78,1.12,.75,ry);
    }
    function openBook(x,y,z,ry=0){
        collision(x,y+.04,z,.49,.08,.36,ry);
        const local=[],S=writer(local,{x,y,z,ry});
        S(0,.015,0,.49,.03,.36,P.red);S(-.12,.04,0,.23,.025,.335,P.paper);S(.12,.04,0,.23,.025,.335,P.paper);
        for(let row=0;row<11;row++)for(const side of [-1,1]){
            S(side*.12,.055,-.137+row*.025,.16-(row%4)*.018,.003,.003,P.oak2);
        }
        S(0,.06,.12,.014,.015,.21,P.gold);list.push(...local);
    }
    function lamp(x,y,z){
        collision(x,y+.25,z-.02,.3,.5,.22);
        B(x,y+.027,z,.22,.045,.16,P.gold);B(x,y+.23,z,.026,.42,.026,P.gold);
        B(x,y+.45,z-.045,.3,.085,.18,P.green);B(x,y+.406,z-.045,.25,.012,.12,P.light);
        for(let j=0;j<9;j++)B(x-.12+j*.03,y+.495,z-.045,.008,.01,.13,P.gold);
    }
    function table(x,y,z,w,d){
        B(x,y+.78,z,w,.11,d,P.oak);
        collision(x,y+.425,z,w,.85,d);
        B(x,y+.839,z,w-.08,.009,d-.08,'#bf915e');
        for(const dx of [-w/2+.18,w/2-.18])for(const dz of [-d/2+.18,d/2-.18]){
            B(x+dx,y+.38,z+dz,.08,.74,.08,P.dark);B(x+dx,y+.06,z+dz,.085,.12,.085,P.gold);
        }
        for(let t=-w/2+.08;t<w/2;t+=.08)B(x+t,y+.787,z+d/2+.004,.038,.035,.01,P.gold);
    }
    function plant(x,y,z,size=.55){
        collision(x,y+.26,z,size,.52,size);
        B(x,y+.25,z,size,.5,size,P.chalk);B(x,y+.515,z,size-.07,.035,size-.07,P.oak2);
        B(x,y+.85,z,.055,.7,.055,P.oak2);
        for(let j=0;j<17;j++){
            const t=j*2.4,r=.15+noise(j)*.25,h=.66+noise(j+15)*.5;
            B(x+Math.cos(t)*r,y+h,z+Math.sin(t)*r,.15,.04,.29,j%2?P.green:P.teal,j*21);
        }
    }
    function rug(x,y,z,w,d){
        B(x,y+.015,z,w,.025,d,P.teal);
        for(let j=0;j<40;j++)for(let l=0;l<16;l++){
            B(x-w/2+.04+j*(w-.08)/40,y+.03,z-d/2+.04+l*(d-.08)/16,(w-.1)/44,.005,(d-.1)/20,(j+l)%7===0?P.gold:'#3a6159');
        }
        for(let j=0;j<55;j++)for(const sign of [-1,1])B(x-w/2+.04+j*(w-.08)/55,y+.025,z+sign*(d/2+.06),.02,.007,.12,P.edge);
    }
    use('lower');floorBoards(.65);
    // Reception with fluted frontage, return slot and a real catalogue desk.
    solid(-.3,1.21,5.2,3.3,1.12,.83,P.dark);
    B(-.3,1.8,5.2,3.5,.09,1.02,P.oak);
    for(let j=0;j<60;j++)B(-1.92+j*.055,1.26,5.64,.023,.92,.035,P.gold);
    B(-1.28,1.55,5.67,.7,.13,.025,P.black);word(B,'RETURN',-1.28,1.27,5.685,.025,P.paper);
    B(.45,2.04,5.1,.47,.3,.05,P.black);B(.45,2.04,5.134,.42,.25,.008,'#809b87');
    B(.45,1.865,5.35,.5,.025,.18,P.black);chair(-.35,.65,4.3,180);openBook(-1.4,1.85,5.2,20);lamp(1,1.85,5.2);
    // Central communal reading table, beneath the suspended cube constellation.
    rug(.1,.65,.2,4.5,5.1);table(.1,.7,.1,1.55,3.4);
    for(const x of [-1.25,1.45])for(const z of [-.9,.9])chair(x,.7,z,x<0?90:270);
    for(const z of [-.8,.65]){openBook(.12,1.54,z,90);lamp(.6,1.54,z+.35);}
    // Children's sunlit platform, low picture book bins, quilt and small stools.
    solid(-5.72,.77,4.9,4.65,.24,3.65,P.oak2);rug(-5.72,.9,4.8,3.5,2.7);
    for(const x of [-6.8,-4.6]){B(x,1.07,4.8,.9,.28,.9,P.green);B(x,1.22,4.8,.82,.04,.82,P.teal);}
    table(-5.7,.92,5.05,1.35,.85);openBook(-5.7,1.76,5.05);
    for(let j=0;j<16;j++){
        B(-7.65+j*.23,1.18,3.28,.17,.43,.3,covers[j%8]);B(-7.65+j*.23,1.21,3.44,.12,.28,.013,P.paper);
        word(B,['A','B','C','D'][j%4],-7.65+j*.23,1.18,3.453,.018,covers[j%8]);
    }
    B(-5.9,1.05,3.24,4.2,.12,.48,P.oak2);B(-5.9,1.38,3.02,4.2,.68,.12,P.oak2);
    // Pocket coffee station beneath the east stair, cups, grinder, drip tray.
    // Move the whole coffee table +2 X, clear of the lower stair exit.
    solid(7.25,1.14,6.65,1.8,.98,.8,P.dark);B(7.25,1.66,6.65,1.9,.1,.9,P.oak);
    B(6.75,1.91,6.58,.48,.45,.42,P.black);B(6.75,2.15,6.58,.44,.05,.38,P.gold);
    collision(6.75,1.92,6.58,.48,.5,.42);
    for(let j=0;j<12;j++)B(6.54+j*.038,1.72,6.81,.017,.025,.14,P.gold);
    for(const x of [7.2,7.48,7.76]){B(x,1.79,6.64,.14,.18,.14,P.chalk);B(x,1.89,6.64,.1,.015,.1,P.oak2);}
    plant(2.35,.65,6.45);plant(-7.75,.92,6.4);plant(3.2,.65,-5.7,.7);
    // Back east reading alcove, art and brass-edged display shelf.
    table(6.35,.65,-4.4,2.8,1.2);chair(5.6,.65,-3.45);chair(7.1,.65,-3.45);
    openBook(5.7,1.49,-4.4);openBook(7,1.49,-4.4);lamp(6.4,1.49,-4.7);
    // Ceiling beams have individually inset strips and small suspension blocks.
    for(let z=-6.7;z<6.9;z+=.24){
        B(-5.6,4.47,z,6.2,.1,.065,P.oak2);
        if(z<-2.5||z>3.8)B(.9,4.47,z,6.5,.1,.065,P.oak2);
    }
    // The atrium chandelier: a folded cascade of luminous little cubes.
    for(let j=0;j<39;j++){
        const a=j*.62,r=.7+(j%4)*.3,x=.2+Math.cos(a)*r,z=.5+Math.sin(a)*r,y=5.7+(j%9)*.21;
        B(x,(8.75+y)/2,z,.008,8.75-y,.008,P.gold);
        B(x,y,z,.16,.18,.16,P.gold);B(x,y-.018,z+.083,.115,.11,.01,P.light);
    }

    use('upper');floorBoards(4.75,true);
    // Quiet study carrels along the front window, each with a task lamp and book.
    for(const x of [-7.4,-5.7,-4,0,1.7]){
        table(x,4.75,6.55,1.45,.85);chair(x,4.75,5.55,180);
        lamp(x-.4,5.59,6.55);openBook(x+.1,5.59,6.55);
        B(x-.76,5.78,6.55,.035,.45,.85,P.oak2);
    }
    // Deep green booth at the western window-side gallery, fluted rear screen.
    solid(-6.45,5.08,3.55,3.7,.66,.85,P.dark);
    B(-6.45,5.47,3.55,3.65,.2,.83,P.green);B(-6.45,5.9,3.22,3.7,.85,.16,P.teal);
    for(let j=0;j<64;j++)B(-8.24+j*.057,5.1,4.005,.025,.58,.033,P.oak);
    for(let j=0;j<42;j++)B(-8.14+j*.083,5.58,3.91,.03,.01,.018,P.edge);
    table(-6.4,4.75,4.7,2.35,.75);openBook(-6.4,5.59,4.7);
    // Archive cabinets and a scale-model display in the east-side quiet room.
    table(6.3,4.75,-4.45,3.2,1.05);chair(5.4,4.75,-3.45);chair(7.2,4.75,-3.45);
    lamp(5.1,5.59,-4.5);lamp(7.45,5.59,-4.5);openBook(6.4,5.59,-4.4);
    for(let j=0;j<14;j++){
        B(3.35,5.05+j*.17,-5.9,.9,.15,1.45,P.oak2);
        B(3.825,5.05+j*.17,-5.9,.025,.06,.24,P.gold);
    }
    plant(2.9,4.75,5.65);plant(-8.2,4.75,5.7);
    for(let z=-6.8;z<7;z+=.23){
        B(-5.7,8.69,z,5.9,.1,.065,P.oak);
        B(5.7,8.69,z,5.9,.1,.065,P.oak);
    }
    for(const x of [-7.9,-3.4,3.35,7.9])B(x,8.615,0,.045,.025,13.8,P.light);
    // Rail-side displays with layered pages and embroidered fabric binding.
    for(const z of [-1.35,1.6]){table(-3.25,4.75,z,1,.8);openBook(-3.25,5.59,z,90);}

    // Thirty-two shelf bays, two floor levels. Coarse coloured books stay visible;
    // only nearby bindings, gilded titles and page edges request high detail.
    for(const floor of [0,1]){
        let idx=0;
        for(const z of [-5.5,-3.45,-1.4,.65,2.7])bays.push({id:floor*16+idx++,floor,x:-8.36,z,ry:90});
        for(const x of [-6.9,-4.85,-2.8,-.75,1.3,3.35,5.4])bays.push({id:floor*16+idx++,floor,x,z:-6.92,ry:0});
        for(const z of [-4.65,-2.55])for(const dir of [0,1])bays.push({id:floor*16+idx++,floor,x:-5.12+dir*.46,z,ry:dir?90:270});
    }
    for(const bay of bays){
        const Y=bay.floor?4.75:.65,S=writer(groups['shelves'+bay.floor],{x:bay.x,y:Y,z:bay.z,ry:bay.ry});
        // Routed uprights, twin crown mouldings, plinth, back and brass tags.
        S(0,1.57,-.205,1.99,3.14,.07,P.oak2);
        for(const x of [-.98,.98]){
            S(x,1.62,0,.095,3.24,.49,P.oak);
            for(let j=0;j<3;j++)S(x-.024+j*.024,1.62,.255,.008,3.12,.012,P.gold);
            for(let j=0;j<18;j++)S(x, .29+j*.158,.246,.015,.012,.01,P.dark);
        }
        for(const y of [.08,3.18,3.25])S(0,y,0,2.05,.08,.53,P.oak);
        for(let row=0;row<7;row++){
            const y=.17+row*.425;
            S(0,y,0,1.96,.045,.47,P.oak);S(0,y+.015,.245,1.97,.016,.018,P.gold);
            for(const x of [-.85,0,.85])S(x,y-.05,.16,.035,.06,.1,P.gold);
        }
        S(0,3.115,.255,.64,.12,.02,P.dark);word(S,['FICTION','SCIENCE','ART','HISTORY'][bay.id%4],0,3.08,.271,.016,P.gold);
        for(let row=0;row<6;row++)for(let i=0;i<20;i++){
            const book=bookSpec(bay,row,i);
            S(book.x,book.y+book.h/2,0,book.w,book.h,.32,book.color);
        }
        const a=bay.ry*Math.PI/180;
        collision(bay.x,Y+1.64,bay.z,2.06,3.28,.55,bay.ry);
        bay.focus={x:EAST_LIBRARY.x+bay.x+Math.sin(a)*.95,y:Y+1.65,z:EAST_LIBRARY.z+bay.z+Math.cos(a)*.95};
    }

    use('landscape');
    // Intimate front court with stone joints, slender hedges and a reflecting rill.
    solid(0,.535,10.5,23,.07,6,P.stone);
    for(let ix=0;ix<38;ix++)for(let iz=0;iz<10;iz++)B(-11.1+ix*.59,.579,7.85+iz*.54,.575,.02,.525,(ix+iz)%6===0?P.chalk:'#9e9e89');
    for(const x of [-10.8,10.8]){
        solid(x,.87,10.5,.65,.65,5.2,P.dark);
        for(let j=0;j<140;j++){
            const z=8+noise(j)*5,y=1.25+noise(j+271)*.38;
            B(x+(noise(j+88)-.5)*.52,y,z,.12,.11,.19,j%3===0?P.teal:P.green,j*19);
        }
    }
    solid(-6.3,.74,11.7,5.6,.4,1.15,P.dark);B(-6.3,.95,11.7,5.32,.025,.86,'#355c59');
    for(let j=0;j<55;j++)B(-8.7+j*.086,.968,11.72,.045,.004,.68,j%3===0?'#527a73':'#3e665f');
    for(const x of [4.6,7.8]){
        solid(x,.83,11.4,2.45,.5,.7,P.oak2);
        for(let j=0;j<7;j++)B(x,1.12,11.12+j*.085,2.5,.08,.065,P.oak);
        plant(x+1.7,.55,11.4,.45);
    }
    // A copper folded-book marker on the approach, built out of thin cuboids.
    solid(-2.55,1,10.3,.85,.9,.85,P.dark);
    for(let j=0;j<17;j++)B(-2.86+j*.038,1.65+Math.abs(j-8)*.014,10.3,.027,.55,.6,P.gold);
    word(B,'FOLIO',2.1,.91,10.15,.072,P.chalk);

    // Clear glass is a separate carrier, excluded from solid opaque batching.
    use('glass');
    for(const y of [2.67,6.77])for(const x of [-7.28,-4.25,4.25,7.28]){
        B(x,y,7.36,2.74,2.91,.012,'#b0d9cc1a');
        for(let j=-1;j<=1;j++)B(x+j*.78,y,7.37,.012,2.75,.012,'#b0d9cc1a');
    }
    B(0,6.65,7.36,5.16,3.6,.012,'#b0d9cc1a');
    for(let x=-2.2;x<=2.21;x+=.55)B(x,6.65,7.37,.012,3.5,.012,'#b0d9cc1a');
    for(let z=-6;z<7;z+=1.2)B(8.85,4.9,z,.012,7.65,1.02,'#b0d9cc1a');
    for(let z=-6;z<7;z+=1.2)B(8.87,4.9,z,.012,7.65,.035,'#b0d9cc1a');
    B(0,8.97,.15,5.55,.012,7.1,'#b0d9cc1a');
    for(let x=-2.5;x<=2.51;x+=.5)for(let z=-3.2;z<3.5;z+=.65)B(x,8.98,z,.018,.012,.42,'#b0d9cc1a');
    const baseCount=Object.values(groups).reduce((n,a)=>n+a.length,0);
    return {groups,colliders,bays,baseCount,envelope:{w:18,d:15,h:8.5}};
}

function bookSpec(bay,row,i){
    const seed=bay.id*997+row*31+i,h=.285+noise(seed)*.095,w=.069+noise(seed+8)*.016;
    return {x:-.883+i*.093,y:.194+row*.425,w,h,color:covers[(i+row*3+bay.id)%covers.length],seed};
}
export function makeEastBindingDetail(bay){
    const data=[],S=writer(data,{x:bay.x,y:bay.floor?4.75:.65,z:bay.z,ry:bay.ry});
    for(let row=0;row<6;row++)for(let i=0;i<20;i++){
        const b=bookSpec(bay,row,i),{x,y,w,h,color,seed}=b;
        // Front binding, cloth-covered boards, visible paper at the head and foot.
        S(x,y+h/2,.17,w+.004,h+.004,.022,color);
        for(const dx of [-w/2,w/2])S(x+dx,y+h/2,0,.005,h+.009,.36,color);
        S(x,y+h+.002,-.01,w-.012,.007,.305,P.paper);
        S(x,y+.002,-.01,w-.012,.007,.305,P.edge);
        // Paper edge detail disabled for the performance comparison.
        for(const yy of [.031,h-.029]){S(x,y+yy,.184,w*.9,.004,.004,P.gold);S(x,y+yy+.008,.184,w*.85,.002,.004,P.gold);}
        // Four individually lettered title glyphs stacked down each narrow spine.
        // Book title glyphs disabled for the performance comparison.
        // Tiny publisher emblem, call number, stitched headband and corner wear.
        S(x,y+.043,.185,.018,.01,.005,P.paper);
        for(let j=0;j<3;j++)S(x-.013+j*.013,y+.055,.185,.004,.006+noise(seed+j)*.006,.004,P.gold);
        for(let j=0;j<4;j++)S(x-w/2+.013+j*(w-.026)/3,y+h-.01,.184,.004,.009,.004,P.gold);
    }
    return data;
}
