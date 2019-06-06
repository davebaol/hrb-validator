New ideas and improvements for future releases
==============================================

[0] Improvements for v0.2.x
-----------------------------------------
- Improve code allowing backward references and preventing forward ones inside a scope

[1] New user-defined validators
-----------------------------------------

def:
  - $MY_VALIDATOR:                                       # name (part of the signature)
    - [myPath:path, num:integer|boolean, ...rest:string] # arguments (part of the signature)
    - isType: [{$var: path}, path]                       # body
  
  - $MY_VALIDATOR: [mypath, 3, hello, world]             # invocation

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
  - @len: 0
  - every:
    - attachments
    - and
      - add: [@len, {$path: value.content.length}]
      - isNumber: [{$var: @len}, { min: 0, max: 100 }]
    
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
