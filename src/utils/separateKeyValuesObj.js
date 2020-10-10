var item = { first : 1, second : 2 }


var key=[];
var value=[];


for(i in item)
{
key.push(i);
value.push(item[i]);
}


console.log(key.toString());
console.log(value);