import React from 'react';
import { AtaChaptersTitle } from '@shared/ata';
import { Route } from 'react-router-dom';
import { InfoCircleFill } from 'react-bootstrap-icons';
import { CompactUI } from './Pages/Compact';
import { ComfortUI } from './Pages/Comfort/Comfort';
import { Navbar } from '../UtilComponents/Navbar';
import { useAppDispatch, useAppSelector } from '../Store/store';
import { SimpleInput } from '../UtilComponents/Form/SimpleInput/SimpleInput';
import { PageLink, PageRedirect } from '../Utils/routing';
import { useFailuresOrchestrator } from '../failures-orchestrator-provider';
import { setSearchQuery } from '../Store/features/failuresPage';

export const Failures = () => {
    const { allFailures } = useFailuresOrchestrator();
    const chapters = Array.from(new Set(allFailures.map((it) => it.ata))).sort((a, b) => a - b);

    const dispatch = useAppDispatch();
    const { searchQuery } = useAppSelector((state) => state.failuresPage);

    const filteredFailures = allFailures.filter((failure) => {
        if (searchQuery === '') {
            return true;
        }

        const failureNameUpper = failure.name.toUpperCase();

        return failureNameUpper.includes(searchQuery)
        || failure.identifier.toString().includes(searchQuery)
        || AtaChaptersTitle[failure.ata].toUpperCase().includes(searchQuery);
    });

    const filteredChapters = chapters.filter((chapter) => filteredFailures.map((failure) => failure.ata).includes(chapter));

    const tabs: PageLink[] = [
        { name: 'Comfort', component: <ComfortUI chapters={filteredChapters} failures={filteredFailures} /> },
        { name: 'Compact', component: <CompactUI chapters={filteredChapters} failures={filteredFailures} /> },
    ];

    return (
        <>
            <div className="flex flex-row justify-between space-x-4">
                <h1 className="font-bold">Failures</h1>

                <div className="flex flex-row items-center py-1 px-4 space-x-2 rounded-md bg-colors-yellow-400">
                    <InfoCircleFill className="text-theme-body" />
                    <p className="text-theme-body">Full simulation of the failures below isn't yet guaranteed.</p>
                </div>
            </div>

            <div className="p-4 mt-4 space-y-4 rounded-lg border-2 border-theme-accent h-content-section-reduced">
                <div className="flex flex-row space-x-4">
                    <SimpleInput
                        placeholder="SEARCH"
                        className="flex-grow uppercase"
                        value={searchQuery}
                        onChange={(value) => dispatch(setSearchQuery(value.toUpperCase()))}
                    />
                    <Navbar basePath="/failures" tabs={tabs} />
                </div>

                <Route path="/failures/comfort">
                    <ComfortUI chapters={filteredChapters} failures={filteredFailures} />
                </Route>
                <Route path="/failures/compact">
                    <CompactUI chapters={filteredChapters} failures={filteredFailures} />
                </Route>
            </div>

            <PageRedirect basePath="/failures" tabs={tabs} />
        </>
    );
};
