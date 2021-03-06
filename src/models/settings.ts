/**
 * Settings Model.
 *
 * Manages the getting and setting of settings
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import config from 'config';
import Database from '../db';
import util from 'util';

const DEBUG = false || (process.env.NODE_ENV === 'test');

/**
 * Get a setting.
 *
 * @param {String} key Key of setting to get.
 */
export async function getSetting(key: string): Promise<any> {
  try {
    return await Database.getSetting(key);
  } catch (e) {
    console.error('Failed to get', key);
    throw e;
  }
}

/**
 * Set a setting.
 *
 * @param {String} key Key of setting to set.
 * @param value Value to set key to.
 */
export async function setSetting<T>(key: string, value: T): Promise<T> {
  try {
    await Database.setSetting(key, value);

    if (DEBUG) {
      console.log('Set', key, 'to',
                  util.inspect(value, {breakLength: Infinity}));
    }
    return value;
  } catch (e) {
    console.error('Failed to set', key, 'to',
                  util.inspect(value, {breakLength: Infinity}));
    throw e;
  }
}

/**
 * Delete a setting.
 *
 * @param {String} key Key of setting to delete.
 */
export async function deleteSetting(key: string): Promise<void> {
  try {
    await Database.deleteSetting(key);
  } catch (e) {
    console.error('Failed to delete', key);
    throw e;
  }
}

/**
 * Get an object of all tunnel settings
 * @return {localDomain, mDNSstate, tunnelDomain}
 */
export async function getTunnelInfo():
Promise<{localDomain: string, mDNSstate: string, tunnelDomain: string}> {
  // Check to see if we have a tunnel endpoint first
  const result = await getSetting('tunneltoken');
  let localDomain;
  let mDNSstate;
  let tunnelEndpoint;

  if (typeof result === 'object') {
    console.log(`Tunnel domain found. Tunnel name is: ${result.name} and`,
                `tunnel domain is: ${result.base}`);
    tunnelEndpoint =
      `https://${result.name}.${result.base}`;
  } else {
    tunnelEndpoint = 'Not set.';
  }

  // Find out our default local DNS name Check for a previous name in the
  // DB, if that does not exist use the default.
  try {
    mDNSstate = await getSetting('multicastDNSstate');
    localDomain = await getSetting('localDNSname');
    // If our DB is empty use defaults
    if (typeof mDNSstate === 'undefined') {
      mDNSstate = config.get('settings.defaults.mdns.enabled');
    }
    if (typeof localDomain === 'undefined') {
      localDomain = config.get('settings.defaults.mdns.domain');
    }
  } catch (err) {
    // Catch this DB error. Since we don't know what state the mDNS process
    // should be in make sure it's off
    console.error(`Error getting DB entry for multicast from the DB: ${err}`);
    localDomain = config.get('settings.defaults.mdns.domain');
  }

  console.log(`Tunnel name is set to: ${tunnelEndpoint}`);
  console.log(`Local mDNS Service Domain Name is: ${localDomain}`);
  return {
    localDomain,
    mDNSstate,
    tunnelDomain: tunnelEndpoint,
  };
}
