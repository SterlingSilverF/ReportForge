import React, { Component } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { Layout } from './components/Layout';
import './components/dynamicIcons';
import { ReportFormProvider } from './contexts/ReportFormContext';
import { ConnectionFormProvider } from './contexts/ConnectionFormContext';

export default class App extends Component {
    static displayName = App.name;

    render() {
        return (
            <ReportFormProvider>
                <ConnectionFormProvider>
                    <Routes>
                        {AppRoutes.map((route, index) => {
                            const element = route.includeNavbar ? (
                                <Layout>{route.element}</Layout>
                            ) : (
                                route.element
                            );

                            return <Route key={index} path={route.path} element={element} />;
                        })}
                    </Routes>
                </ConnectionFormProvider>
            </ReportFormProvider>
        );
    }
}