package com.tribetalk.tribetalk.Talha;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class StreamsTotalTransactionsPerCustomer {
    public static void main(String[] args) {

        List<StreamsTotalTransactionsPerCustomer.Transaction> transactions = Arrays.asList(
                new StreamsTotalTransactionsPerCustomer.Transaction("Alice", new BigDecimal("120.50")),
                new StreamsTotalTransactionsPerCustomer.Transaction("Bob", new BigDecimal("250.00")),
                new StreamsTotalTransactionsPerCustomer.Transaction("Alice", new BigDecimal("300.75")),   // repeated
                new StreamsTotalTransactionsPerCustomer.Transaction("David", new BigDecimal("180.25")),
                new StreamsTotalTransactionsPerCustomer.Transaction("Eve", new BigDecimal("500.00")),
                new StreamsTotalTransactionsPerCustomer.Transaction("Bob", new BigDecimal("75.00")),      // repeated
                new StreamsTotalTransactionsPerCustomer.Transaction("Grace", new BigDecimal("220.50")),
                new StreamsTotalTransactionsPerCustomer.Transaction("Hannah", new BigDecimal("150.00")),
                new StreamsTotalTransactionsPerCustomer.Transaction("Ivan", new BigDecimal("400.00")),
                new StreamsTotalTransactionsPerCustomer.Transaction("Alice", new BigDecimal("95.25"))     // repeated
        );

        Map<String, BigDecimal> transactionTotal= transactions.stream().collect(Collectors.groupingBy(StreamsTotalTransactionsPerCustomer.Transaction::name,Collectors.mapping(
                StreamsTotalTransactionsPerCustomer.Transaction::transactionAmount,
                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add)
        )));
        transactionTotal.forEach((transactionName,transactionAmount)->{System.out.printf("Customer : %S Amoutn : %s %n",transactionName,transactionAmount);});

    }
    public record Transaction(String name,BigDecimal transactionAmount){};

}
