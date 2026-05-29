const gen=(base,vol,trend)=>Array.from({length:30},(_,i)=>({d:"D"+(i+1),p:+(base+Math.sin(i*0.42)*vol+trend*i+Math.random()*1.6-0.8).toFixed(1)}));
export const PRICES={Onion:gen(16,3.5,0.19),Tomato:gen(20,5,0.13),Wheat:gen(26,2,0.07),Cotton:gen(61,6,0.16),Rice:gen(32,2.5,0.09)};
export const BUYERS=[
  {name:"Pune Fresh Mart",type:"Retailer",dist:"42 km",offer:26,qty:"500 kg",rating:4.8,tag:"Top Buyer",color:"#E65100"},
  {name:"Mumbai Exports Ltd",type:"Exporter",dist:"165 km",offer:29,qty:"2 tonnes",rating:4.6,tag:"Premium",color:"#1565C0"},
  {name:"Nashik Restaurant Co.",type:"Restaurant",dist:"8 km",offer:24,qty:"200 kg",rating:4.9,tag:"Nearest",color:"#388E3C"},
  {name:"AgroLink Wholesale",type:"Wholesaler",dist:"23 km",offer:22,qty:"5 tonnes",rating:4.4,tag:null,color:"#9CA3AF"},
];
export const WX={0:"☀️",1:"🌤",2:"⛅",3:"☁️",61:"🌧",80:"🌦",95:"⛈"};
export const wx=(c)=>WX[c]??"🌤";
export const CROP_EMOJI={Onion:"🧅",Tomato:"🍅",Wheat:"🌾",Cotton:"🌿",Rice:"🌾"};