---
title: "Rust notes"
description: ""
pubDate: "Nov 13 2022"
---

## Cargo commands

`cargo new <project_name>`: start new project

`cargo run`: compile and run project

`cargo build`: build executable

## Language basics

### Primitive types

`bool`: boolean

`char`: character

`f32, f64`: floats

`i8, i16, i32, i64, i128`: signed integer

`u8, u16, u32, u64, u128`: unsigned integer

`isize`: pointer-sized signed integer

`usize`: pointer-sized unsigned integer

### Printing

Prints output

```rust
print!("Hello World\n");
```

Prints output with newline at the end

```rust
println!("Appending a new line");
```

Prints as an error

```rust
eprint!("This is an error\n");
```

Prints as an error with new line

```rust
eprintln!("This is an error with new line");
```

### Formatting

Single Placeholder

```rust
println!("{}", 1);
```

Multiple Placeholder

```rust
println!("{} {}", 1, 3);
```

Positional Arguments

```rust
println!("{0} is {1} {2}, also {0} is a {3} programming language", "Rust", "cool", "language", "safe");
```

Named Arguments

```rust
println!("{country} is a diverse nation with unity.", country = "India");
```

Placeholder traits :b for binary, :0x is for hex and :o is octal

```rust
println!("Let us print 76 as binary which is {:b} , and hex equivalent is {:0x} and octal equivalent is {:o}", 76, 76, 76);
```

Debug Trait

```rust
println!("Print whatever we want to here using debug trait {:?}", (76, 'A', 90));
```

New Format Strings in v1.58

```rust
let x = "world";
println!("Hello {x}!");
```

### Tuple

A Tuple can have mixed element types.
Create a tuple

```rust
let tup = (50, "hi", true);
```

Accessing tuple element by index

```rust
tup.1;  //index 1, or the 2nd element from tuple.
```

Tuple unwrapping

```rust
let (x, y, z) = tup;
```

### Array

An Array exists on the stack and has fixed type and size.
Create an array with inferred type:

```rust
let arr = [1, 2, 3]
```

Create an array of specific type:

```rust
let arr: [i32; 3] = [4, 5, 6];
```

Accessing array element by index

```rust
array[0]; // index 0 or the first element from the array
```

Mutability

```rust
let mut arr = [1, 2, 3];  // only mutable array can be modified
arr[0] = 0;
```

### Vector

A Vector is dynamic "growable" array, and allocates memory on the heap.
Declare a vector using vec macro

```rust
let vect = vec![1,2,3];
```

Create a vector using Vec constructor

```rust
let vect = Vec::new();
```

Create a fixed size vector

```rust
let vect = Vec::<i32>::with_capacity(3);
```

Create a vector from an iterator

```rust
let vect: Vec<i32> = (0..5).collect();
```

Vector mutations

```rust
vect.pop();
vect.push(4);
vect.reverse();
```

### Slice

A slice is a view of an array or a vector, and it cannot be stored as a variable or passed as function arguments; it can only be stored as a reference, these are non-owning references.

Create a slice

```rust
let v: Vec<i32> = (0..5).collect();
let s1: &[i32] = &v;  // pointing at the vector v
let s2: &[i32] = &v[2..4];  // point at element 2 up to 4 of vector v
```

### String

Create a string on the heap (global and not null terminated). These are dynamic, owned and can be modified:

```rust
let str1 = String::from("Hello");
let str2 = "Hello".to_string();
let str3 = str1.replace("Hello", "Hi");
```

A string slice (&str) is a fat pointer containing both address, data, and its length. It cannot be modified, it does not allocate memory on the heap.

```rust
let str1 = "Hello";  // this is a &str
let str2 = str1.to_string();  // this is a string
let str3 = &str2;  // this is a &str
```

Comparing strings

```rust
str1 == str2;
str1 != str2;
"ONE".to_lowercase() == "one";   // true
```

String literals are typically used when the data is not valid UTF-8 (whereas both String and &str can only have UTF-8 sequences):

```rust
let rust = "\x52\x75\x73\x74";  // string literal "Rust"
```

### Control flow

Logical control

```rust
if a > b {
  //
} else if a == b {
  //
} else {
  //
}

```

Loop

```rust
loop {
  //
  break;
}
```

Loop with name

```rust
'counter: loop {
  //
  break;
}
```

You can break out of a named loop from anywhere inside:

```rust
'counter: loop {
  let mut num_inner = 0;
  loop {
    if num_inner == 3 {
      break 'counter;  // this breaks out the outer loop named "counter"
    }
    num_inner += 1;
  }
}
```

While loop

```rust
let mut num = 0;
while num < 5 {
  num += 1;
}
```

For loop

```rust
  let vec: Vec<i8> = (0..10).collect();
  for element in vec {
    //
  }
  for element in (1..10).rev() {
    //
  }
```

## Ownership

```rust
fn f() {
  let var = 1;           // created on stack
  let mut s = "string";  // created on heap
  s.push_str(" string"); // grows s
}
```

Both `var` and `s` are dropped as soon as the function `f` returns.

### Move ownership

```rust
let x = vec!["hello".to_string()];
let y = x;          // moves ownership
println!("{:?}, x); // error: borrow of moved value 'x'
println!("{:?}, y); // works fine
```

The ownership of the vector has been moved from `x` to `y`, therefore cannot be referenced from `x`.

### Clone ownership

```rust
let x = vec!["hello".to_string()];
let y = x.clone();
println!("{:?}, x);
println!("{:?}, y);
```

Every single value inside the vector has been cloned to `y`.

### Copy ownership

```rust
let x = 1;
let y = x;
println!("x={}, y={}", x, y);  // works fine
```

This works because integer implements "copy" and not "move.
Types that implements "copy" includes: integer, float, boolean.
A tuple can also have "copy" if every value it contains implements "copy".
