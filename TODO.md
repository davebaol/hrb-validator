New ideas for future releses
============================

[1] New user-defined validators
-----------------------------------------

def:
  - $MY_VALIDATOR:
    - [my_path:path|null, num:integer, ...rest:string]
    - isType: [{$var: path}, path]
  - $MY_VALIDATOR: [mypath, 3, hello, world]

[2] R/W variables
-----------------------------------------
SETTER:
- opSet(var, val)
- opAdd(var, val)
- opSub(var, val)
- opMul(var, val)
- opDiv(var, val)
- opAddMul(var, val, k)
- opSubMul(var, val, k)
- opConcat(var, val)
- opNot(var, val)
- opAnd(var, val)
- opOr(var, val)

{
  attachments: [
    {content: "1234567890"},
    {content: "qwerty"},
    {content: "zxcvbnm"},
    {content: "a b c d e f g h i"}
  ]
}   

def:
  - totLen: 0
  - len: 0
  - every:
    - attachments
    - and
      - add: [len, {$path: value.content.length}]
      - isNumber: [{$var: totLen}, { min: 0, max: 100 }]
    
--------------------------
    
{
  relatives: [
    {parent: true},
    {parent: false},
    {parent: true},
  ]
}   

def:
  - numParents: 0
  - every:
    - relatives
    - and:
      - equals: [value.parent, true] 
      - add: [numParents, 1]
      - isNumberVar: [{$var: numParents}, { min: 0, max: 2 }]
