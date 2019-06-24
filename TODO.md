New ideas and improvements for future releases
==============================================

## Improvements for v0.3.x
- Improve code allowing backward references and preventing forward ones inside a scope

## New user-defined validators
```yaml
def:
  - $MY_VALIDATOR:                                       # name (part of the signature)
    - [myPath:path, num:integer|boolean, ...rest:string] # arguments (part of the signature)
    - isType: [{$var: path}, path]                       # body
  
  - $MY_VALIDATOR: [mypath, 3, hello, world]             # invocation
```

## R/W variables and operators
-----------------------------------------
- New operators to use in expressions for run-time calculation
  - Arithmetic
    - @add(val1, ..., valN)
    - @sub(val1, ..., valN)
    - @mul(val1, ..., valN)
    - @div(val1, ..., valN)
  - Logical
    - @not(val)
    - @and(val1, ..., valN)
    - @or(val1, ..., valN)
    - @xor(val1, ..., valN)
  - String
    - @concat(val1, ..., valN)
    - @substring(str, start, end)
  - Conversion
    - @toBytes(val)
    - @toMillis(val)
- Non constant variables are prefixed by @ and defined as usual
  ```yaml
  def:
    - @var1: hello
      @var2: {@concat: [{$var: @var1}, ' world']}
      ...
      @varN: true
    - child
  ```
- New validator assign allows you to set R/W variables already defined and reachable from the current scope
  ```yaml
  assign:
    - @var1: {@add: [3, {@mul: [{$var: @var1.length}, 2]}]}
      @var2: {@concat: [{$var: @var2}, '!!!']}
      ...
      @varN: {@not: [{$var: @varN}]}
    - child
  ```

### Example 1:
Consider the object below
```json
{
  "attachments": [
    {"content": "1234567890..."},
    {"content": "qwerty..."},
    {"content": "zxcvbnm..."},
    {"content": "a b c d e f g h i..."}
  ]
}   
```
You want to check if total content length exceeded a certain value 
```yaml
def:
  - @len: 0                           # accumulator
  - maxLen: {@toBytes: [1 Kb]}        # constant
  - every:
    - attachments
    - assign:
      - @len: {@add: [{$var: @len}, {$path: value.content.length}]}
      - isNumberVar: [{$var: @len}, { min: 0, max: {$var: maxLen} }]
```

### Example 2:
Consider the object below
```json
{
  "relatives": [
    {"parent": true},
    {"parent": false},
    {"parent": true},
  ]
}   
```
You want to check if there are at most two parents amongst relatives
```yaml
def:
  - @numParents: 0
  - every:
    - relatives
    - if:
      - equals: [value.parent, true] 
      - assign:
        - @numParents: {@add: [{$var: @numParents}, 1]
        - isNumberVar: [{$var: @numParents}, { min: 0, max: 2 }]
```
