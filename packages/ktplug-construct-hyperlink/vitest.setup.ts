import * as matchers from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";
import "@testing-library/jest-dom/vitest";

// `jest-dom` のマッチャーを登録
expect.extend(matchers);
