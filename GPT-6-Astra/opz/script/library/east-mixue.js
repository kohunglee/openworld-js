// MIXUE: 18 x 15 m, one storey with a walkable roof terrace.
export function makeEastMixue(){
 const outside=[],inside=[],glass=[],colliders=[];let dst=outside;
 const Z=-25;
 const C={red:'#e9163e',white:'#fff2da',wood:'#bb8955',dark:'#292b30',steel:'#b3b8bb',gold:'#e6bd65',green:'#396e42'};
 const b=(x,y,z,w,h,d,c=C.white,ry=0)=>{const q={x:70+x,y,z:Z+z,w,h,d,b:c,ry};dst.push(q);return q;};
 const hit=(x,y,z,w,h,d,ry=0)=>colliders.push({x:70+x,y,z:Z+z,w,h,d,ry});
 const solid=(x,y,z,w,h,d,c=C.white)=>{b(x,y,z,w,h,d,c);hit(x,y,z,w,h,d);};
 const letters={M:['10001','11011','10101','10001','10001','10001','10001'],I:['111','010','010','010','010','010','111'],X:['10001','01010','00100','00100','00100','01010','10001'],U:['10001','10001','10001','10001','10001','10001','01110'],E:['11111','10000','10000','11110','10000','10000','11111']};
 function word(text,x,y,z,s){let cursor=x;for(const ch of text){const a=letters[ch];for(let r=0;r<a.length;r++)for(let j=0;j<a[r].length;j++)if(a[r][j]==='1')b(cursor+j*s,y-r*s,z,s*.91,s*.91,.08);cursor+=(a[0].length+1)*s;}}
 function rail(x,y,z,len,axis='x'){
  const a=axis==='x';b(x,y+1.06,z,a?len:.08,.08,a?.08:len,C.red);
  for(let t=-len/2;t<=len/2;t+=.18)b(x+(a?t:0),y+.53,z+(a?0:t),.025,1.03,.025,C.white);
  hit(x,y+.55,z,a?len:.1,1.1,a?.1:len);
 }
 function plant(x,y,z){b(x,y+.23,z,.5,.46,.5,C.white);hit(x,y+.3,z,.6,.6,.6);
  for(let j=0;j<24;j++){const a=j*2.4;b(x+Math.cos(a)*.2,y+.58+(j%4)*.09,z+Math.sin(a)*.2,.09,.38,.045,C.green,j*37);}}
 function chair(x,y,z){hit(x,y+.55,z,.65,1.1,.65);b(x,y+.5,z,.6,.09,.6);b(x,y+.91,z-.26,.6,.62,.08,C.red);
  for(const dx of [-.24,.24])for(const dz of [-.24,.24])b(x+dx,y+.23,z+dz,.055,.46,.055,C.wood);
  for(let t=-.26;t<.28;t+=.04)b(x+t,y+.97,z-.31,.016,.45,.015,C.white);}
 function table(x,y,z){hit(x,y+.42,z,1.45,.84,.85);b(x,y+.8,z,1.45,.09,.85);
  for(const dx of [-.6,.6])for(const dz of [-.3,.3])b(x+dx,y+.39,z+dz,.07,.78,.07,C.wood);
  plant(x,y+.85,z);chair(x,y,z+1);chair(x,y,z-1);}
 solid(0,.45,0,18,.3,15,C.dark);
 solid(0,2.7,-7.4,18,4.5,.2);solid(-8.9,2.7,0,.2,4.5,15);
 solid(8.9,2.7,0,.2,4.5,15);
 // Roof with east-side stair opening; 24 risers rise from .6 to 5.0.
 solid(-1.25,4.9,0,15.5,.2,15,C.white);
 solid(7.65,4.9,-6,2.3,.2,3,C.white);
 solid(7.65,4.9,6.65,2.3,.2,1.7,C.white);
 for(let i=0;i<24;i++){
  const z=5.7-i*.4,top=.6+(i+1)*4.4/24;
  solid(7.65,top-.09,z,1.9,.18,.42,C.wood);
  b(7.65,top+.01,z+.15,1.87,.025,.04,C.red);
  for(let t=-.85;t<.86;t+=.065)b(7.65+t,top+.005,z,.018,.012,.36,C.gold);
 }
 solid(7.65,4.9,-4.55,1.9,.2,.9);
 // Guard both long edges of the stairwell and all roof edges.
 rail(6.57,5,.65,10.5,'z');rail(8.74,5,.65,10.5,'z');
 rail(0,5,-7.25,17.6);rail(0,5,7.25,17.6);rail(-8.75,5,0,14.5,'z');
 rail(8.75,5,-6.1,2.2,'z');rail(8.75,5,6.5,1.5,'z');
 // Front glazing: open central doorway and deeply framed display bays.
 for(const x of [-8.7,-5.8,-2.4,2.4,5.8,8.7])solid(x,2.55,7.35,.14,4,.18,C.dark);
 for(const x of [-5.6,5.6]){solid(x,.79,7.35,6,.35,.18,C.red);hit(x,2.5,7.35,6,3.8,.12);}
 solid(0,4.22,7.5,18,1.1,.55,C.red);word('MIXUE',-3.4,4.55,7.8,.125);
 // Rasterize the Chinese shop name into actual small cubes, no extra texture.
 const sign=typeof document!=='undefined'?document.createElement('canvas'):null;
 if(sign?.getContext){
  sign.width=224;sign.height=48;const ctx=sign.getContext('2d');
  ctx.fillStyle='#fff';ctx.font='bold 42px sans-serif';ctx.textBaseline='top';ctx.fillText('蜜雪冰城',4,1);
  const pixels=ctx.getImageData(0,0,224,48).data;
  for(let y=0;y<48;y++)for(let x=0;x<224;x++)if(pixels[(y*224+x)*4+3]>128)b(1.2+x*.026,4.73-y*.019,7.81,.025,.018,.065);
 }
 // Pixel snow king, circular silhouette built from small cubes.
 for(let iy=-15;iy<=15;iy++)for(let ix=-14;ix<=14;ix++){
  if(ix*ix+iy*iy<180)b(-5+ix*.028,4.23+iy*.028,7.81,.029,.029,.07);
 }
 b(-5.13,4.28,7.86,.05,.065,.04,C.dark);b(-4.89,4.28,7.86,.05,.065,.04,C.dark);
 b(-5.01,4.12,7.86,.12,.025,.04,C.red);
 for(let j=0;j<5;j++)b(-5.24+j*.11,4.67+(j%2)*.08,7.82,.085,.2,.07,C.gold);
 // Red-white awning and fine horizontal siding.
 for(let x=-8.9;x<9;x+=.25)b(x,3.55,7.83,.24,.08,1.1,Math.round(x*4)%2?C.red:C.white);
 for(let y=.8;y<4;y+=.055)for(let z=-7.2;z<7.2;z+=.3)b(-9.015,y,z,.024,.036,.285,C.white);
 // Roof deck boards, pergola, picnic seats and planters.
 for(let x=-8.6;x<6.2;x+=.16)for(let z=-7;z<7;z+=.8)b(x,5.02,z,.15,.03,.79,(Math.round(x*10)%3)?C.wood:C.gold);
 for(const x of [-6,-1,3])table(x,5.05,1.5);
 for(const x of [-7.8,4.8])for(const z of [-5,4.7]){b(x,6.35,z,.13,2.6,.13,C.red);hit(x,6.35,z,.13,2.6,.13);}
 for(let x=-8;x<5.2;x+=.25)b(x,7.65,-.15,.09,.12,10.3,C.wood);
 for(const x of [-8,5])for(const z of [-6,5.5])plant(x,5.03,z);
 // Low roof lounge platform, long benches and drink ledges.
 for(let i=0;i<3;i++){solid(-5+i*3,5.35,-4.8,2.4,.6,.7,C.red);b(-5+i*3,5.7,-4.8,2.35,.15,.65);}
 dst=inside;
 // Parquet, brass seams, fluted walls.
 for(let x=-8.7;x<6.2;x+=.23)for(let z=-7.1;z<7.1;z+=.56){
  b(x,.615,z,.22,.025,.55,Math.round((x+z)*5)%3?C.wood:C.gold);
  for(let j=0;j<5;j++)b(x-.075+j*.034,.632,z,.005,.004,.49,'#a77d52');
 }
 for(let x=-8.7;x<6.3;x+=.18){b(x,2.5,-7.25,.12,3.5,.055,C.wood);b(x,2.5,-7.2,.014,3.5,.018,C.gold);}
 // Service counter, white stone top, closely fluted timber front.
 solid(-.9,1.25,-2.7,11.3,1.3,1.4,C.wood);b(-.9,1.95,-2.7,11.6,.13,1.5);
 for(let x=-6.45;x<4.7;x+=.07){b(x,1.25,-1.96,.032,1.22,.035,C.gold);for(let y=.7;y<1.8;y+=.12)b(x,y,-1.935,.013,.055,.009,C.wood);}
 // Cash register and queue markers.
 solid(3.3,2.19,-2.6,.65,.45,.45,C.dark);b(3.3,2.25,-2.34,.54,.28,.02,'#58a8ad');
 for(let z=-.8;z<5;z+=1)b(3.4,.65,z,.6,.008,.05,C.red);
 // Back bar refrigerators and dispensers, each has one solid collision envelope.
 for(const x of [-6,-3.7,-1.4,1,3.4]){
  solid(x,1.65,-5.8,1.7,2.1,1.2,C.steel);b(x,2.9,-5.8,1.7,.4,1.2,C.red);
  b(x,1.75,-5.185,1.42,1.62,.025,C.dark);
  for(let row=0;row<4;row++){b(x,1+row*.43,-5.13,1.4,.04,.13);for(let j=0;j<8;j++){
   b(x-.57+j*.16,1.16+row*.43,-5.08,.105,.24,.1,(j%3)?C.white:C.red);
   b(x-.57+j*.16,1.3+row*.43,-5.08,.115,.035,.11,C.gold);
  }}
 }
 // Cups on counter, tea urns with spigots, sink and espresso equipment.
 for(let i=0;i<6;i++){const x=-5.8+i*1.05;solid(x,2.38,-2.8,.5,.75,.6,C.steel);b(x,2.37,-2.475,.38,.4,.025,C.dark);b(x,2.2,-2.41,.06,.14,.15,C.red);}
 for(let x=-5;x<2.7;x+=.3)for(let j=0;j<6;j++)b(x,2.04+j*.026,-2.13,.14,.025,.14,j%2?C.white:C.red);
 // Three menu screens suspended above the counter.
 for(const x of [-4.7,-1.4,1.9]){
  b(x,3.45,-3,2.65,1.15,.12,C.dark);b(x,3.45,-2.93,2.49,1,.015,'#f5cc75');
  for(let i=0;i<5;i++){b(x-.98+i*.48,3.5,-2.91,.24,.4,.02,i%2?C.red:C.white);for(let j=0;j<4;j++)b(x-.98+i*.48,3.15+j*.045,-2.9,.28,.012,.012,C.dark);}
 }
 // Seating and pendant shades, tiered to form cone profiles.
 for(const x of [-6,-2,1.8])for(const z of [1.1,4.7]){
  table(x,.65,z);b(x,3.8,z,.025,1.2,.025,C.gold);
  for(let j=0;j<24;j++)b(x,3.35+j*.019,z,.58-j*.017,.018,.58-j*.017,j<17?C.red:C.gold);
  b(x,3.32,z,.5,.025,.5,'#fff9ba');
 }
 // Ceiling service beams and small downlights.
 for(let x=-8;x<6;x+=1.3){b(x,4.68,0,.12,.12,14,C.white);for(let z=-6;z<7;z+=1.5)b(x,4.59,z,.16,.045,.16,'#fff9ca');}
 for(const x of [-8,5.3])for(const z of [-.7,6.3])plant(x,.65,z);
 dst=glass;for(const x of [-5.6,5.6])b(x,2.4,7.37,5.9,2.9,.012,'#b0d9cc03');
 const total=outside.length+inside.length+glass.length;
 if(total>100000)throw Error('蜜雪冰城超出方块预算');
 return {outside,inside,glass,colliders,total};
}
