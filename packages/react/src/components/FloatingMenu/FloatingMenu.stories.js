/**
 * Copyright IBM Corp. 2023, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Button, TextInput } from '@carbon/react';
import { Modal } from '../Modal';
import { FloatingMenu, FloatingMenuItem } from '../FloatingMenu';
import mdx from './FloatingMenu.mdx';
import styles from './_story-styles.scss';

export default {
  title: 'Components/FloatingMenu',
  component: FloatingMenu,
  argTypes: {},
  parameters: {
    docs: {
      page: mdx,
    },
    styles,
    layout: 'centered',
  },
  decorators: [
    (story) => <div className="floating-menu--story-wrapper">{story()}</div>,
  ],
};

const ModalWrapper = () => {
  const ModalStateManager = ({
    renderLauncher: LauncherContent,
    children: ModalContent,
  }) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        {!ModalContent || typeof document === 'undefined'
          ? null
          : ReactDOM.createPortal(
              <ModalContent open={open} setOpen={setOpen} />,
              document.body
            )}
        {LauncherContent && <LauncherContent open={open} setOpen={setOpen} />}
      </>
    );
  };
  return (
    <ModalStateManager
      renderLauncher={({ setOpen }) => (
        <Button onClick={() => setOpen(true)}>Launch modal</Button>
      )}>
      {({ open, setOpen }) => (
        <Modal
          modalHeading="Add a custom domain"
          modalLabel="Account resources"
          primaryButtonText="Add"
          secondaryButtonText="Cancel"
          open={open}
          onRequestClose={() => setOpen(false)}>
          <p
            style={{
              marginBottom: '1rem',
            }}>
            Custom domains direct requests for your apps in this Cloud Foundry
            organization to a URL that you own. A custom domain can be a shared
            domain, a shared subdomain, or a shared domain and host.
          </p>
          <TextInput
            data-modal-primary-focus
            id="text-input-1"
            labelText="Domain name"
            placeholder="e.g. github.com"
            style={{
              marginBottom: '1rem',
            }}
          />
          <FloatingMenu label="Actions">
            <FloatingMenuItem
              label="Undo"
              onClick={() => console.log('Undo')}
            />
            <FloatingMenuItem label="Redo" disabled />
            <FloatingMenuItem label="Cut" />
            <FloatingMenuItem label="Paste" />
          </FloatingMenu>
        </Modal>
      )}
    </ModalStateManager>
  );
};

export const Default = (args) => {
  return (
    <FloatingMenu
      label="Actions"
      className="floating-menu--custom-classname"
      {...args}>
      <FloatingMenuItem label="Undo" onClick={() => console.log('Undo')} />
      <FloatingMenuItem label="Redo" disabled />
      <FloatingMenuItem label="Cut" />
      <FloatingMenuItem label="Paste" />
    </FloatingMenu>
  );
};

export const InsideModal = (args) => {
  return <ModalWrapper args={args} />;
};
