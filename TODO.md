# Implementazione references

## Step 1:
- [x] `{ref: path.to.property}` restituisce il valore al percorso per l'oggetto da validare

## Step 2:

#### Utilizzo di un reference
Un reference deve avere una sola delle tre seguenti chiavi (che iniziano tutte per $):
- `{$path: path.to.property}` è il ref dello step 1 e restituisce il valore al percorso per l'oggetto da validare
- `{$var: variableName}` restituisce la prima variabile trovata a quel nome negli scope annidati cercandola dall'interno verso l'esterno
- `{$val: validatorName}` restituisce il primo validatore trovato a quel nome negli scope annidati cercandolo dall'interno verso l'esterno

Si noti che `$path` e `$var` sono riferimenti a un valore e possono essere usati ovunque serva appunto un valore.
Al contrario, `$val` è un riferimento ad un validatore e può quindi essere usato solo nei branch validator per gli argomenti di tipo child. 

#### Checklist
Si noti che alcuni degli elementi della seguente checklist sono descritti più in dettaglio nelle sezioni successive.
- [ ] Nuovo branch validator `def`
- [ ] Modificare il branch validator `call` (rinominarlo in `use`?)
- [ ] Supporto ai reference in ensure-arg.js per le funzioni `validator`, `validators` e `scope`
- [ ] Supporto ai reference in tutti i validatori sia di tipo leaf che branch

#### Nuovo branch validator `def`
Il nuovo branch validator
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
#### Modificare il branch validator `call`
Il branch validator call diventa semplicemente `call(path, child)`.
Occorre quindi apportare le seguenti modifiche:
- L'argomento `validatorName` diventa un normale `child` con supporto ai validator reference
- Rimuovere argomento scope

Valutare anche se rinominare `call` in `use`, visto che dopo le modifiche il validatore si limiterà a stringere il campo della validazione del child all'oggetto puntato dal `path`

