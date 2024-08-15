# SpeedyMatrix

[Speedy](speedy.md) includes its own fast implementation of matrices. They are used extensively in encantAR.js.

## Properties

### rows

`matrix.rows: number, read-only`

Number of rows of the matrix.

### columns

`matrix.columns: number, read-only`

Number of columns of the matrix.

## Methods

### read

`matrix.read(): number[]`

Read the entries of the matrix in [column-major format](https://en.wikipedia.org/wiki/Row-_and_column-major_order){ ._blank }.

**Returns**

The entries of the matrix in column-major format.

**Example**

```js
/*

Suppose that you are given this matrix:

         [ 1  4  7 ]
matrix = [ 2  5  8 ]
         [ 3  6  9 ]

Its entries in column-major format are: [1,2,3,   4,5,6,   7,8,9]

*/

const entries = matrix.read();
```

### toString

`matrix.toString(): string`

Convert to string.

**Returns**

A human-readable representation of the matrix.

**Example**

```js
console.log(matrix.toString());
```