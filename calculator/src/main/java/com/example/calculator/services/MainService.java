package com.example.calculator.services;

import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.SpelEvaluationException;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;


@Service
public class MainService {

    private final ExpressionParser parser = new SpelExpressionParser();

    private final List<Result> history = new ArrayList<>();

    int cnt = 0;

    public Double evaluate(String expression) {

        String expr = expression.replace('÷', '/').replace('×', '*').replaceAll("\\s+", "");

        try {
            // Check for 0/0 first (undefined result) - matches 0/0, 0.0/0, 0.000/0.0000, etc.
            if (expr.matches(".*\\b0+(?:\\.0+)?\\s*/\\s*0+(?:\\.0+)?\\b.*")) {
                if (expr.matches("(?s).*(?:^|[+\\-*/^(])\\s*(?!0+(?:\\.0+)?\\b)\\d+(?:\\.\\d+)?\\s*/\\s*0+(?:\\.0+)?(?:[+\\-*/^)]|$).*")) {
                    throw new ArithmeticException("Division by zero is not allowed!");
                } else {
                    throw new ArithmeticException("Result is undefined!");
                }
            }


            Expression exp = parser.parseExpression(expr);
            Double result = exp.getValue(Double.class);
            if (result == null) {
                throw new IllegalArgumentException();
            }
            history.add(0, new Result(expression, result));
            cnt++;
            return result;
        } catch (ArithmeticException e) {
            // Re-throw ArithmeticException so controller can handle it
            throw e;
        } catch (SpelEvaluationException | IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid expression!");
        }


    }

    public List<Result> getHistory() {
        return new ArrayList<>(history);
    }

    public void clearHistory() {
        history.clear();
        cnt = 0;
    }


}
