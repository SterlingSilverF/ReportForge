import React, { Component } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { Layout } from './components/Layout';
import './components/dynamicIcons';
import { ReportFormProvider } from './contexts/ReportFormContext';

export default class App extends Component {
    static displayName = App.name;

    render() {
        return (
            <ReportFormProvider>
                <Routes>
                    {AppRoutes.map((route, index) => {
                        const element = route.includeNavbar ?
                            <Layout>{route.element}</Layout> :
                            route.element;

                        return (
                            <Route key={index} path={route.path} element={element} />
                        );
                    })}
                </Routes>
            </ReportFormProvider>
        );
    }
}