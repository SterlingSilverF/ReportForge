import React, { Component } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { Layout } from './components/Layout';
import './components/dynamicIcons';

export default class App extends Component {
    static displayName = App.name;

    render() {
        return (
            <Routes>
                {AppRoutes.map((route, index) => {
                    // Create the element with or without the Layout based on includeNavbar
                    const element = route.includeNavbar ?
                        <Layout>{route.element}</Layout> :
                        route.element;

                    return (
                        <Route key={route.path} path={route.path} element={element} />
                    );
                })}
            </Routes>
        );
    }
}