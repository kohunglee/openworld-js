// 9 x 15 m software / film atelier. Four rooms, furniture-focused detailing.
export function makeEastStudio(){
 const outside=[],inside=[],colliders=[];let list=outside;
 const Z=-25;
 const C={wall:'#d8d1c3',dark:'#242938',wood:'#755340',blue:'#355a85',metal:'#9fa7ae',light:'#ffe6aa',white:'#f6eee1',orange:'#cc653e'};
 const b=(x,y,z,w,h,d,c=C.wood)=>{const q={x:90+x,y,z:Z+z,w,h,d,b:c};list.push(q);return q};
 const hit=(x,y,z,w,h,d)=>colliders.push({x:90+x,y,z:Z+z,w,h,d});
 const s=(x,y,z,w,h,d,c)=>{b(x,y,z,w,h,d,c);hit(x,y,z,w,h,d)};
 const desk=(x,y,z,w,d)=>{s(x,y+.4,z,w,.8,d,C.wood);b(x,y+.83,z,w+.04,.06,d+.04,C.dark);for(const dx of [-w/2+.12,w/2-.12])b(x+dx,y+.38,z,.06,.76,d-.12,C.metal)};
 const chair=(x,y,z)=>{hit(x,y+.6,z,.7,1.2,.7);b(x,y+.51,z,.64,.14,.64,C.blue);b(x,y+.93,z+.28,.65,.7,.12,C.blue);b(x,y+.23,z,.1,.42,.1,C.metal);b(x,y+.07,z,.65,.08,.12,C.dark);b(x,y+.07,z,.12,.08,.65,C.dark);for(const dx of [-.32,.32])b(x+dx,y+.73,z,.07,.06,.5,C.dark)};
 const monitor=(x,y,z,w)=>{b(x,y+.3,z,w,.6,.09,C.dark);b(x,y+.3,z+.06,w-.07,.51,.016,'#324e69');b(x,y-.09,z,.08,.2,.08,C.metal);b(x,y-.2,z,.4,.035,.25,C.metal);for(let i=0;i<4;i++)b(x-w*.32,y+.45-i*.1,z+.077,w*(.3+i*.08),.016,.012,i%2?C.light:'#80bda8')};
 const plant=(x,y,z)=>{s(x,y+.2,z,.4,.4,.4,C.wall);for(let i=0;i<5;i++)b(x+(i%2?.12:-.12),y+.55+i*.06,z+(i%3-1)*.12,.13,.5,.08,'#486d4d')};
 s(0,.47,0,9,.26,15,C.dark);s(-4.4,4.15,0,.2,7.1,15,C.wall);s(4.4,4.15,0,.2,7.1,15,C.wall);s(0,4.15,-7.4,8.6,7.1,.2,C.wall);
 // Opaque blue window panels deliberately separated from the wall surfaces.
 for(const x of [-2.9,2.9]){s(x,4.15,7.4,2.8,7.1,.2,C.wall);b(x,2.35,7.54,2.2,2.2,.06,C.blue);b(x,5.85,7.54,2.2,2.2,.06,C.blue)}
 s(0,6,7.4,3,3.4,.2,C.wall);s(0,3.63,7.4,3,.3,.2,C.dark);
 // Roof cutout over the second stair flight, deck top at 7.86.
 s(-.95,7.78,0,6.7,.16,15,C.dark);
 s(3.35,7.78,-6.1,1.9,.16,2.6,C.dark);
 s(3.35,7.78,6.5,1.9,.16,2,C.dark);
 for(let i=0;i<22;i++){const z=5.2-i*.47,top=4+(i+1)*3.86/22;
  s(3.35,top-.075,z,1.65,.15,.48,C.wood);
 }
 for(const x of [-4.28,4.28]){s(x,8.41,0,.1,1.1,14.5,C.dark);}
 for(const z of [-7.2,7.2])s(0,8.41,z,8.46,1.1,.1,C.dark);
 s(2.42,8.41,.35,.1,1.1,11.9,C.dark);
 // Full-height outdoor double-return vestibule with a roof.
 s(0,2.1,9.25,5.6,3,.16,C.blue);s(-2.72,2.1,8.3,.16,3,1.74,C.blue);
 s(3.9,2.1,8.85,.16,3,2.7,C.blue);s(.65,2.1,10.65,6.6,3,.16,C.blue);
 s(.55,3.66,9.1,6.85,.12,3.25,C.dark);
 // Single deliberate offset stripe, no repetitive facade pattern.
 b(-3.9,4.2,7.6,.22,6.8,.08,C.orange);
 s(-.95,3.9,0,6.7,.2,14.6,C.wood);s(3.35,3.9,-6.15,1.9,.2,2.3,C.wood);s(3.35,3.9,6.4,1.9,.2,1.8,C.wood);
 for(let i=0;i<20;i++){const z=5.2-i*.47,top=.6+(i+1)*3.4/20;s(3.35,top-.085,z,1.7,.17,.48,C.wood);b(3.35,top+.013,z+.18,1.65,.026,.04,C.metal)}
 s(3.35,3.9,-4.4,1.7,.2,1.2,C.wood);
 s(2.4,4.55,.4,.12,1.1,10.7,C.dark);b(2.4,5.13,.4,.16,.06,10.7,C.wood);
 // Tall entrance screen makes entry a turn; office begins behind it.
 s(.15,1.85,5.3,2.5,2.5,.16,C.blue);b(.15,3.14,5.3,2.55,.06,.2,C.orange);
 // Doorway partitions: upstairs bedroom / bathroom; downstairs office / dining.
 for(const y of [2.2,5.6]){s(-1.4,y,-.4,5.6,3.2,.14,C.wall);s(1.85,y+1.3,-.4,.9,.6,.14,C.wall)}
 list=inside;
 // Ground-floor editing desk: three displays, tower, audio, keyboard and tablet.
 desk(-1.4,.6,1.4,4.3,1.05);
 for(const x of [-2.8,-1.4,0])monitor(x,1.85,1.2,1.22);
 chair(-1.4,.6,2.6);s(.45,1.05,1.4,.5,.9,.8,C.dark);b(.71,1.07,1.4,.025,.68,.56,C.blue);
 b(-1.4,1.51,1.72,1.15,.045,.29,C.dark);
 for(let row=0;row<3;row++)for(let col=0;col<12;col++)b(-1.88+col*.087,1.541,1.63+row*.08,.065,.016,.052,C.wall);
 b(-.45,1.52,1.73,.13,.055,.21,C.white);b(-2.6,1.52,1.72,.62,.04,.33,C.blue);
 for(const x of [-3.35,.55]){b(x,1.72,1.2,.28,.45,.28,C.dark);b(x,1.74,1.353,.16,.23,.018,C.metal)}
 // Video corner: tripod, camera, softbox and freestanding backdrop.
 s(-2.6,1.75,4.1,2.8,2.3,.12,C.wall);
 s(.8,1.35,3.7,.45,1.5,.45,C.dark);b(.8,2.16,3.7,.42,.26,.28,C.dark);b(.8,2.16,3.5,.21,.21,.16,C.metal);
 b(.8,1.3,3.7,.045,1.45,.045,C.metal);
 s(-3.7,1.6,3.25,.35,2,.35,C.dark);b(-3.7,2.64,3.25,.62,.52,.16,C.white);
 // Editing accessories shelf, camera cases, lenses and awards.
 s(-3.85,1.75,1.7,.48,2.3,2.3,C.dark);
 for(let row=0;row<3;row++){b(-3.85,.95+row*.7,1.7,.5,.05,2.3,C.wood);for(let j=0;j<3;j++){b(-3.56,1.15+row*.7,.9+j*.65,.17,.32,.35,j%2?C.orange:C.metal)}}
 plant(.9,.6,4.65);
 // Dining / kitchen: full cabinetry, oven, induction hob, refrigerator and sink.
 s(-1.8,1.05,-6.7,4.9,.9,1.15,C.wood);b(-1.8,1.54,-6.7,5,.08,1.23,C.wall);
 for(const x of [-3.6,-2.4,-1.2,0]){b(x,1.05,-6.105,1.1,.75,.025,C.wall);b(x,1.28,-6.075,.36,.035,.025,C.metal)}
 b(-2.8,1.595,-6.65,1,.025,.68,C.dark);for(const x of [-3,-2.6])b(x,1.618,-6.65,.24,.012,.43,C.metal);
 b(-.5,1.6,-6.65,.8,.025,.65,C.metal);b(-.5,1.62,-6.65,.65,.018,.5,C.dark);b(-.5,1.85,-6.94,.045,.5,.045,C.metal);b(-.5,2.08,-6.78,.045,.045,.35,C.metal);
 s(1.5,1.7,-6.7,1.1,2.2,1.2,C.metal);b(1.5,1.2,-6.085,1,.035,.015,C.dark);b(1.91,1.9,-6.05,.035,.65,.04,C.dark);
 s(-2.6,2.7,-7,2.4,.7,.55,C.wall);b(-2.6,2.31,-6.8,2.25,.04,.2,C.light);
 desk(-1.25,.6,-3.4,2.5,1.15);chair(-1.9,.6,-2.4);chair(-.55,.6,-2.4);
 for(const x of [-1.9,-.55]){b(x,1.49,-3.4,.48,.025,.4,C.white);b(x+.35,1.6,-3.55,.12,.2,.12,C.blue)}
 plant(-3.6,.6,-2);
 // Upstairs bedroom: floating bed, padded headboard, lamps, wardrobe and couch.
 s(-1.4,4.28,3.3,2.7,.56,2.7,C.wood);b(-1.4,4.69,3.3,2.6,.26,2.6,C.white);b(-1.4,4.85,2.95,2.61,.045,1.8,C.blue);
 s(-1.4,4.85,4.73,2.85,1.7,.16,C.wood);
 for(const x of [-2,-.8])b(x,4.92,4.15,1,.18,.5,C.wall);
 for(const x of [-3.2,.4]){s(x,4.3,4.1,.65,.6,.65,C.dark);b(x,4.94,4.1,.045,.65,.045,C.metal);b(x,5.24,4.1,.36,.28,.36,C.light)}
 s(-3.6,5.2,.9,1.1,2.4,1.6,C.wall);for(const z of [.6,1.2])b(-3.025,5.2,z,.035,.45,.035,C.metal);
 s(-1.3,4.43,6.3,2.5,.86,.8,C.blue);b(-1.3,4.98,6.65,2.5,.55,.15,C.blue);
 b(-1.3,4.02,3.3,3.3,.02,3.8,'#9c8170');
 // Bathroom: solid shower enclosure, open entry, WC, vanity, mirror and towels.
 s(-3,5.1,-5.95,2.2,2.2,.14,C.blue);s(-4,5.1,-4.9,.14,2.2,2,C.blue);
 b(-3.85,5.65,-5.25,.08,.08,.5,C.metal);b(-3.85,5.4,-5.1,.035,.65,.035,C.metal);
 s(-2.8,4.12,-5,2,.24,1.7,C.wall);b(-2.8,4.255,-5,.22,.018,.22,C.dark);
 s(.7,4.4,-6.1,.65,.8,1,C.white);b(.7,4.91,-6.45,.65,.75,.28,C.white);b(.7,4.84,-5.9,.66,.065,.6,C.wall);
 s(-2,4.4,-1.4,2.3,.8,.9,C.wood);b(-2,4.85,-1.4,2.4,.1,.98,C.white);b(-2,4.92,-1.4,.65,.025,.5,C.metal);
 b(-2,5.65,-.505,1.8,1.1,.05,C.blue);b(-2,6.26,-.51,1.85,.06,.08,C.light);
 for(let i=0;i<3;i++)b(-2.85,4.95+i*.07,-1.4,.4,.06,.48,C.wall);
 for(const [x,z,y] of [[-1,2,7.25],[-1,-3,7.25],[-1,2,3.6],[-1,-3,3.6]])b(x,y,z,1.6,.06,.35,C.light);
 // Sculpted furniture surfaces: continuous monochrome shapes, not facade dots.
 // A freestanding oval bath, leather lounge chair, camera lens, and ceramic vase.
 const objects=[
  {x:0,y:4.05,z:-3.8,w:2.1,h:.75,d:1.15,c:C.white,kind:'tub'},
  {x:.65,y:4.08,z:1.5,w:1.05,h:1.15,d:1.15,c:C.orange,kind:'seat'},
  {x:.8,y:2.16,z:3.27,w:.2,h:.2,d:.24,c:C.dark,kind:'lens'},
  {x:-.1,y:1.52,z:-3.4,w:.22,h:.34,d:.22,c:C.blue,kind:'vase'}
 ];
 for(const o of objects)if(o.kind==='tub'||o.kind==='seat')hit(o.x,o.y+o.h/2,o.z,o.w,o.h,o.d);
 function sculpt(step){
  const result=[];
  for(const o of objects){
   const nx=Math.ceil(o.w/step),ny=Math.ceil(o.h/step),nz=Math.ceil(o.d/step),dx=o.w/nx,dy=o.h/ny,dz=o.d/nz;
   const occupied=(i,j,l)=>{
    if(i<0||j<0||l<0||i>=nx||j>=ny||l>=nz)return false;
    const x=(i+.5)/nx*2-1,y=(j+.5)/ny,z=(l+.5)/nz*2-1,r=x*x+z*z;
    if(o.kind==='tub')return r<1&&(y<.16||r>.68);
    if(o.kind==='seat')return r<1&&(y<.43||(z>.4&&y<.95)||Math.abs(x)>.77&&y<.72);
    if(o.kind==='lens')return x*x+Math.pow(y*2-1,2)<1;
    return r<Math.pow(.65+.25*Math.sin(y*3.14),2)&&(y<.12||r>.28);
   };
   for(let i=0;i<nx;i++)for(let j=0;j<ny;j++)for(let l=0;l<nz;l++){
    if(!occupied(i,j,l))continue;
    if(occupied(i-1,j,l)&&occupied(i+1,j,l)&&occupied(i,j-1,l)&&occupied(i,j+1,l)&&occupied(i,j,l-1)&&occupied(i,j,l+1))continue;
    result.push({x:90+o.x-o.w/2+(i+.5)*dx,y:o.y+(j+.5)*dy,z:o.z-o.d/2+(l+.5)*dz,w:dx,h:dy,d:dz,b:o.c});
   }
  }
  return result;
 }
 const base=outside.length+inside.length;
 let detail;
 for(let step=.065;step>=.018;step-=.00015){const candidate=sculpt(step);if(base+candidate.length>=4800&&base+candidate.length<=5000){detail=candidate;break;}}
 if(!detail)throw Error('Studio detail resolution outside budget');
 inside.push(...detail);
 const total=outside.length+inside.length;if(total<4800||total>5000)throw Error('Studio budget');
 return {outside,inside,colliders,total};
}
