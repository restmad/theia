/********************************************************************************
 * Copyright (C) 2018 Red Hat, Inc. and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { injectable, inject } from 'inversify';
import { MenuPath, ILogger } from '@theia/core';
import { MenuModelRegistry } from '@theia/core/lib/common';
import { EDITOR_CONTEXT_MENU } from '@theia/editor/lib/browser';
import { NAVIGATOR_CONTEXT_MENU } from '@theia/navigator/lib/browser/navigator-contribution';
import { PluginContribution } from '../../../common';
import { VIEW_ITEM_CONTEXT_MENU } from '../view/tree-views-main';

@injectable()
export class MenusContributionPointHandler {

    @inject(MenuModelRegistry)
    protected readonly menuRegistry: MenuModelRegistry;

    @inject(ILogger)
    protected readonly logger: ILogger;

    handle(contributions: PluginContribution): void {
        if (!contributions.menus) {
            return;
        }

        for (const location in contributions.menus) {
            if (contributions.menus.hasOwnProperty(location)) {
                const menuPath = this.parseMenuPath(location);
                if (!menuPath) {
                    this.logger.warn(`Plugin contributes items to a menu with invalid identifier: ${location}`);
                    continue;
                }
                const menus = contributions.menus[location];
                menus.forEach(menu => {
                    const [group = '', order = undefined] = (menu.group || '').split('@');
                    // Registering a menu action requires the related command to be already registered.
                    // But Theia plugin registers the commands dynamically via the Commands API.
                    // Let's wait for ~2 sec. It should be enough to finish registering all the contributed commands.
                    // FIXME: remove this workaround (timer) once the https://github.com/theia-ide/theia/issues/3344 is fixed
                    setTimeout(() => {
                        this.menuRegistry.registerMenuAction([...menuPath, group], {
                            commandId: menu.command,
                            order
                        });
                    }, 2000);
                });
            }
        }
    }

    protected parseMenuPath(value: string): MenuPath | undefined {
        switch (value) {
            case 'editor/context': return EDITOR_CONTEXT_MENU;
            case 'explorer/context': return NAVIGATOR_CONTEXT_MENU;
            case 'view/item/context': return VIEW_ITEM_CONTEXT_MENU;
        }
    }
}
