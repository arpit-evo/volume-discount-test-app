import { DiscountApplicationStrategy } from "../generated/api";

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 * @typedef {import("../generated/api").Target} Target
 * @typedef {import("../generated/api").ProductVariant} ProductVariant
 */

/**
 * @type {FunctionRunResult}
 */
const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};

type Configuration = {
  quantity: number;
  percentage: number;
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input: any) {
  const configurations: Array<Configuration> = JSON.parse(
    input?.discountNode?.metafield?.value ?? "[]",
  );

  if (!configurations.length) {
    return EMPTY_DISCOUNT;
  }

  let discounts = input.cart.lines
    .map((line: any) => {
      const applicableConfig = configurations
        .filter((configuration) => line.quantity >= configuration.quantity)
        .sort((a, b) => b.quantity - a.quantity)[0];
      console.log("line id", JSON.stringify(line));

      if (!applicableConfig) {
        return null;
      }

      return {
        targets: [
          {
            cartLine: {
              id: line.id,
            },
          },
        ],
        value: {
          percentage: {
            value: applicableConfig.percentage.toString(),
          },
        },
      };
    })
    .filter((discount: any) => discount !== null);

  return {
    discounts: discounts,
    discountApplicationStrategy: DiscountApplicationStrategy.First,
  };
}
