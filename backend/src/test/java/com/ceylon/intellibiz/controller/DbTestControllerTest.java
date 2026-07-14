package com.ceylon.intellibiz.controller;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.PrintWriter;
import java.lang.reflect.Field;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import java.util.logging.Logger;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;

class DbTestControllerTest {

    @Test
    void dbTestReturnsSuccessMessageWhenConnectionWorks() throws Exception {
        DbTestController controller = new DbTestController();
        DataSource dataSource = (DataSource) Proxy.newProxyInstance(
                DataSource.class.getClassLoader(),
                new Class<?>[] {DataSource.class},
                (proxy, method, args) -> {
                    if (method.getName().equals("getConnection")) {
                        Connection connection = (Connection) Proxy.newProxyInstance(
                                Connection.class.getClassLoader(),
                                new Class<?>[] {Connection.class},
                                (connProxy, connMethod, connArgs) -> {
                                    if (connMethod.getName().equals("getMetaData")) {
                                        DatabaseMetaData metadata = (DatabaseMetaData) Proxy.newProxyInstance(
                                                DatabaseMetaData.class.getClassLoader(),
                                                new Class<?>[] {DatabaseMetaData.class},
                                                (metaProxy, metaMethod, metaArgs) -> {
                                                    if (metaMethod.getName().equals("getURL")) {
                                                        return "jdbc:postgresql://localhost:5432/test";
                                                    }
                                                    return defaultValue(metaMethod.getReturnType());
                                                });
                                        return metadata;
                                    }
                                    if (connMethod.getName().equals("isClosed")) {
                                        return false;
                                    }
                                    if (connMethod.getName().equals("getAutoCommit")) {
                                        return true;
                                    }
                                    if (connMethod.getName().equals("getTransactionIsolation")) {
                                        return Connection.TRANSACTION_READ_COMMITTED;
                                    }
                                    if (connMethod.getName().equals("close")) {
                                        return null;
                                    }
                                    return defaultValue(connMethod.getReturnType());
                                });
                        return connection;
                    }
                    return defaultValue(method.getReturnType());
                });
        setField(controller, "dataSource", dataSource);

        String response = controller.dbTest();

        assertTrue(response.contains("PostgreSQL connection successful"));
        assertTrue(response.contains("jdbc:postgresql://localhost:5432/test"));
    }

    @Test
    void dbTestReturnsFailureMessageWhenConnectionFails() throws Exception {
        DbTestController controller = new DbTestController();
        DataSource dataSource = new DataSource() {
            @Override
            public Connection getConnection() {
                throw new RuntimeException("boom");
            }

            @Override
            public Connection getConnection(String username, String password) {
                throw new RuntimeException("boom");
            }

            @Override
            public PrintWriter getLogWriter() {
                return null;
            }

            @Override
            public void setLogWriter(PrintWriter out) {
            }

            @Override
            public int getLoginTimeout() {
                return 0;
            }

            @Override
            public void setLoginTimeout(int seconds) {
            }

            @Override
            public Logger getParentLogger() {
                return Logger.getLogger("com.ceylon.intellibiz");
            }

            @Override
            public <T> T unwrap(Class<T> iface) throws SQLException {
                return null;
            }

            @Override
            public boolean isWrapperFor(Class<?> iface) throws SQLException {
                return false;
            }
        };
        setField(controller, "dataSource", dataSource);

        String response = controller.dbTest();

        assertTrue(response.contains("PostgreSQL connection failed"));
        assertTrue(response.contains("boom"));
    }

    private Object defaultValue(Class<?> returnType) {
        if (returnType == boolean.class) {
            return false;
        }
        if (returnType == int.class) {
            return 0;
        }
        if (returnType == long.class) {
            return 0L;
        }
        if (returnType == float.class) {
            return 0.0f;
        }
        if (returnType == double.class) {
            return 0.0d;
        }
        if (returnType == short.class) {
            return (short) 0;
        }
        if (returnType == byte.class) {
            return (byte) 0;
        }
        if (returnType == char.class) {
            return '\0';
        }
        return null;
    }

    private void setField(DbTestController controller, String fieldName, Object value) throws Exception {
        Field field = DbTestController.class.getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(controller, value);
    }
}
