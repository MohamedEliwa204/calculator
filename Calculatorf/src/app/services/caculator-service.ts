import {Injectable, signal, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';

export interface HistoryItem {
  expression: string;
  result: number;
}

@Injectable({
  providedIn: 'root'
})
export class CaculatorService {
  private http = inject(HttpClient);

  exp = signal('');
  value = signal('0');
  result: boolean = false;
  equal: boolean = false;
  lastOperand: number = 0; // Store the last operand for percent calculation
  lastOperator: string = ''; // Store the last operator
  valueNeg: boolean = false;

  // Shared history signal for SideBar
  history = signal<HistoryItem[]>([]);

  append(value: string, fn: string) {
    // If the previous action was "equal":
    // - typing a digit/decimal should start a new expression (clear)
    // - pressing an operator should continue from the displayed result (don't clear)
    if (this.equal && fn !== "equal") {
      if (fn === '') {
        this.equal = false;
        this.clear();
      }
      this.valueNeg = false;
      // if fn is an operator or unary function we allow the handler below to operate on the result
    }

    if (fn == '') {
      // Handle digit or decimal point input
      if (this.result) {
        // If previous operation was a unary function, start new number
        this.value.set(value);
        this.result = false;
      } else {
        if (this.value() == "0" && value != ".") {
          this.value.set(value);
        } else if (value == "." && this.value().includes(".")) {
          // Don't add decimal if already exists
          return;
        } else {
          this.value.update(prev => prev + value);
        }
      }
    } else if (fn == "negate") {
      const cur = this.value();
      // Compute locally for instant feedback
      const num = parseFloat(cur);
      if (!isNaN(num)) {
        this.value.set((-num).toString());
      }
      // If the last action also produced a unary result, replace the expression;
      // otherwise append the function call to the existing expression.
      if (this.result) {
        this.exp.set(`negate(${cur})`);
      } else {
        this.exp.update(prev => prev + `negate(${cur})`);
      }
      this.valueNeg = true;
      this.result = true;
    } else if (fn == "delete" && !this.result) {
      const cur = this.value();
      if (cur.length > 0) {
        this.value.set(cur.slice(0, -1));
      }
      if (this.value().length == 0) {
        this.value.set("0");
      }
    } else if (fn == "inverse") {
      const cur = this.value();
      // Compute locally for instant feedback
      const num = parseFloat(cur);
      if (!isNaN(num) && num !== 0) {
        this.value.set((1 / num).toString());
      }
      // Update expression consistently with other unary functions
      if (this.result) {
        this.exp.set(`(1/${cur})`);
      } else {
        this.exp.update(prev => prev + `(1/${cur})`);
      }
      this.result = true;
    } else if (fn == "sqrt") {
      const cur = this.value();
      // Compute locally for instant feedback
      const num = parseFloat(cur);
      if (!isNaN(num) && num >= 0) {
        this.value.set((Math.sqrt(num)).toString());
      }

      if (this.result) {
        this.exp.set(`sqrt(${cur})`);
      } else {
        this.exp.update(prev => prev + `sqrt(${cur})`);
      }
      this.result = true;
      this.equal = true;
      // Send to backend for evaluation and history storage
      this.evaluate();
    } else if (fn == "equal" && !this.equal) {
      // Check for division by zero before evaluating
      // if (this.lastOperator == "divide" && parseFloat(this.value()) == 0) {
      //   this.value.set("Cannot divide by zero");
      //   this.exp.set('');
      //   this.equal = true;
      //   this.result = true;
      //   return;
      // }

      // Add current value to expression before evaluating
      if (!this.valueNeg) {
        this.exp.update(prev => prev + this.value());
      }
      this.equal = true;
      // Send to backend for complete evaluation
      this.evaluate();
    } else if (fn == "clear") {
      this.clear();
    } else if (fn == "sqr") {
      const cur = this.value();
      // Compute locally for instant feedback
      const num = parseFloat(cur);
      if (!isNaN(num)) {
        this.value.set((Math.pow(num, 2)).toString());
      }
      // Update expression consistently with other unary functions
      if (this.result) {
        this.exp.set(`sqr(${cur})`);
      } else {
        this.exp.update(prev => prev + `sqr(${cur})`);
      }
      this.result = true;
      this.equal = true;
      // Send to backend for evaluation and history storage
      this.evaluate();
    } else if (fn == "add" || fn == "subtract" || fn == "divide" || fn == "multiply") {
      // When starting an operator after equals, start a fresh expression using the displayed result.
      if (this.equal) {
        // Use the displayed value as the left operand for the new expression
        this.exp.set(this.value() + value);
        this.equal = false;
      } else {
        // Normal behavior: append current value and operator to the expression
        this.exp.update(prev => prev + this.value() + value);
      }
      // Store the operand and operator for percent calculation
      this.lastOperand = parseFloat(this.value());
      this.lastOperator = fn;
      this.value.set("0");
      this.result = false;
    } else if (fn == "percent") {
      const cur = this.value();
      const percentValue = parseFloat(cur);

      if (!isNaN(percentValue) && this.lastOperand !== 0) {
        // Calculate percentage of the last operand
        // For example: 100 + 15% means 100 + (100 * 0.15) = 115
        let result = 0;

        if (this.lastOperator === "add" || this.lastOperator === "subtract") {
          // For addition/subtraction: convert percent to value based on last operand
          result = this.lastOperand * (percentValue / 100);
          this.value.set((result + this.lastOperand).toString());
        } else if (this.lastOperator === "multiply" || this.lastOperator === "divide") {
          // For multiplication/division: just convert to decimal
          result = percentValue / 100;
          this.value.set((result * this.lastOperand).toString());
        }


        // Add to expression for backend - backend should handle the same logic
        this.exp.update(prev => prev + cur + "%");
      } else {
        // No previous operand, just convert to decimal
        const num = parseFloat(cur);
        if (!isNaN(num)) {
          this.value.set((num / 100).toString());
        }
        this.exp.update(prev => prev + "(" + cur + "/100)");
      }
      this.result = true;
      this.equal = true;
      // Send to backend for evaluation and history storage
      this.evaluate();
    }

  }


  clear() {
    this.exp.set('');
    this.value.set("0");
    this.result = false;
    this.lastOperand = 0;
    this.lastOperator = '';
  }

  convertToSpEL(expr: string): string {
    // Convert custom notation to SpEL-compatible format
    let spelExpr = expr;

    // Replace operators with SpEL operators
    spelExpr = spelExpr.replace(/×/g, '*');
    spelExpr = spelExpr.replace(/÷/g, '/');
    spelExpr = spelExpr.replace(/−/g, '-');
    spelExpr = spelExpr.replace(/\+/g, '+');

    // Replace custom functions with Java Math methods
    spelExpr = spelExpr.replace(/sqrt\(([^)]+)\)/g, 'T(java.lang.Math).sqrt($1)');
    spelExpr = spelExpr.replace(/sqr\(([^)]+)\)/g, 'T(java.lang.Math).pow($1, 2)');
    spelExpr = spelExpr.replace(/negate\(([^)]+)\)/g, '(-$1)');

    // Handle percent - convert to the actual calculation
    spelExpr = spelExpr.replace(/(\d+\.?\d*)([+\-])(\d+\.?\d*)%/g, (match, num1, op, num2) => {
      // For add/subtract: num1 op (num1 * num2/100)
      return `${num1}${op}(${num1}*${num2}/100.0)`;
    });

    spelExpr = spelExpr.replace(/(\d+\.?\d*)([*\/])(\d+\.?\d*)%/g, (match, num1, op, num2) => {
      // For multiply/divide: num1 op (num2/100)
      return `${num1}${op}(${num2}/100.0)`;
    });

    // CRITICAL FIX: Ensure division uses double arithmetic
    // Add .0 to whole numbers to force double division (8/3 becomes 8.0/3.0)
    spelExpr = spelExpr.replace(/(\d+)(?=\s*\/)/g, '$1.0');
    spelExpr = spelExpr.replace(/\/\s*(\d+)(?!\d|\.)/g, '/$1.0');

    return spelExpr;
  }

  async evaluate() {
    const expr = this.exp();
    console.log("Original expression:", expr);
    const spelExpr = this.convertToSpEL(expr);
    console.log("SpEL expression:", spelExpr);

    try {
      const url = 'http://localhost:8080/api/evaluate?expression=' + encodeURIComponent(spelExpr);
      console.log("Fetching URL:", url);

      const response = await fetch(url);
      const text = await response.text();
      console.log("Response status:", response.status);
      console.log("Response text:", text);

      // Try to parse as JSON, fallback to plain text
      let data;
      try {
        data = JSON.parse(text);
        console.log("Parsed JSON:", data);
      } catch (parseError) {
        console.log("Failed to parse JSON, using text as error");
        data = {error: text};
      }

      if (!response.ok) {
        const errorMessage = data.error || text || 'Unknown error';
        console.log("Setting error message:", errorMessage);
        this.value.set(errorMessage);
        this.result = true;
      } else {
        // Ensure result is a double (number)
        const resultValue = Number(data.result);
        console.log("Setting result:", resultValue);
        this.value.set(String(resultValue));
        this.result = true;

        // Reload history after successful evaluation so it updates immediately
        this.loadHistory();
      }
    } catch (e) {
      console.error("failed to fetch the response!", e);
      this.value.set("Network error");
      this.result = true;
    }
  }

  // Load history from backend
  loadHistory(): void {
    this.http.get<HistoryItem[]>('http://localhost:8080/api/history').subscribe({
      next: (data) => {
        // Ensure all results are numbers (doubles)
        const historyWithDoubles = data.map(item => ({
          expression: item.expression,
          result: Number(item.result)
        }));
        this.history.set(historyWithDoubles);
      },
      error: (err) => console.error('Failed to load history:', err)
    });
  }

  // Clear history on backend and locally
  clearHistory(): void {
    this.http.delete('http://localhost:8080/api/history').subscribe({
      next: () => this.history.set([]),
      error: (err) => console.error('Failed to clear history:', err)
    });
  }

}
