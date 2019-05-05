# Implementazione references

## Step 1:
- [ ] {ref: path.to.property} restituisce il valore al percorso per l'oggetto da validare

## Step 2:

#### Utilizzo di un reference
Un reference può avere una di tre chiavi (che iniziano tutte per $):
- `{$path: path.to.property}` è il ref dello step 1 e restituisce il valore al percorso per l'oggetto da validare
- `{$var: variableName}` restituisce la prima variabile trovata a quel nome negli scope annidati cercandola dall'interno verso l'esterno
- `{$val: validatorName}` restituisce il primo validatore trovato a quel nome negli scope annidati cercandolo dall'interno verso l'esterno

Si noti che `$path` e `$var` sono riferimenti a un valore e possono essere usati ovunque serva appunto un valore.
Al contrario, `$val` è un riferimento ad un validatore e può quindi essere usato solo nei branch validator per gli argomenti di tipo child. 

#### definire variabili e validatori in uno scope
Serve un nuovo branch validator
  `def(variables, validators, child)`
che definisce uno scope contenente le variabili e i validatori, i quali saranno accessibili solo dal child e dalla sua discendenza.
Un esempio del validatore in YAML 
````yaml
def:
  - num: 10
    str: "Hello!"
    ar: ["foo", "bar"]
  - VALIDATOR_1: {...}
    VALIDATOR_2: {...}
  - and:
    - isInt: [maxLen, {min: {$var: num}]
    - isType: [code, string]
    - isLength: [code, {max: {$path: maxLen}}]
    - call: [my.path, {$val: VALIDATOR_1}]
    - or:
      - {$val: VALIDATOR_1}
      - {$val: VALIDATOR_2}
````
per validare l'oggetto seguente
````yaml
{
  maxLen: 16
  code: "sfsdf sddf sd"
}
````
#### Rimuovere l'argomento scope dalla call
Il branch validator call diventa semplicemente
  `call(path, validatorName)`

