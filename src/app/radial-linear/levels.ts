export const puzzle1 = {
    mode: "multiplying/combining",
    input: "battery/ship",
    batteries: [
      {
        editable: false,
        numerator: 1,
        denominator: 1,
        direction: true,
      },
      {
        editable: false,
        numerator: 1,
        denominator: 1,
        direction: true,
      },
      {
        editable: true,
        numerator: 0,
        denominator: 2,
        direction: true,
      },
    ],
    numberLineDenominator: 1,
    shipWidth: 0.2, // A decimal or fraction in "Number line" coordinate space.
    min: 0, // Usually zero,
    max: 3,
    shipLocation: 2.5,
    timeStep: 2,
    allowPartitionEdits: true,
  };

export const puzzle2 = {
    mode: "multiplying/combining",
    input: "battery/ship",
    numberLineDenominator: 2,
    batteries: [
      {
        editable: false,
        numerator: 1,
        denominator: 1,
        direction: true,
      },
      {
        editable: false,
        numerator: 1,
        denominator: 1,
        direction: true,
      },
      {
        editable: false,
        numerator: 1,
        denominator: 1,
        direction: true,
      },
      {
        editable: true,
        numerator: 0,
        denominator: 4,
        direction: false,
      },
    ],
    shipWidth: 0.15, // A decimal or fraction in "Number line" coordinate space.
    min: 0, // Usually zero,
    max: 3,
    shipLocation: 2.25,
    timeStep: 1.5,
    allowPartitionEdits: true,
  };

  export const puzzle3 = {
    mode: "multiplying/combining",
    input: "battery/ship",
    numberLineDenominator: 1,
    batteries: [
      {
        editable: false,
        numerator: 1,
        denominator: 1,
        direction: true,
      },
      {
        editable: false,
        numerator: 1,
        denominator: 1,
        direction: true,
      },
      {
        editable: false,
        numerator: 2,
        denominator: 3,
        direction: true,
      },
      {
        editable: true,
        numerator: 0,
        denominator: 1,
        direction: false,
      },
      {
        editable: true,
        numerator: 0,
        denominator: 3,
        direction: false,
      },
    ],
    shipWidth: 0.34, // A decimal or fraction in "Number line" coordinate space.
    min: 0, // Usually zero,
    max: 3,
    shipLocation: 1.333,
    timeStep: 1.5,
    allowPartitionEdits: true,
  };


  export const puzzle4 = {
    mode: "multiplying/combining",
    input: "battery/ship",
    numberLineDenominator: 1,
    batteries: [
      {
        editable: false,
        numerator: 1,
        denominator: 1,
        direction: true,
      },
      {
        editable: false,
        numerator: 1,
        denominator: 2,
        direction: false,
      },
      {
        editable: false,
        numerator: 1,
        denominator: 3,
        direction: true,
      },
      {
        editable: false,
        numerator: 1,
        denominator: 4,
        direction: true,
      },
      {
        editable: true,
        numerator: 0,
        denominator: 1,
        direction: true,
      },
    ],
    shipWidth: 0.10, // A decimal or fraction in "Number line" coordinate space.
    min: 0, // Usually zero,
    max: 3,
    shipLocation: 2,
    timeStep: 1,
    allowPartitionEdits: true,
  };



export const Addition = [puzzle1,puzzle2,puzzle3,puzzle4,]
export const Subtraction = []
export const Division = []
export const Multiplication = []

export const Levels = {
    'demo': Addition,
    'addition': Addition,
    'subtraction': Subtraction,
    'division': Division,
    'multiplication': Multiplication
}