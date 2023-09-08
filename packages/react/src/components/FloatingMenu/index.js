import PropTypes from 'prop-types';
import { Button } from '@carbon/react';
import { usePrefix } from '../../internal/usePrefix';
import cx from 'classnames';
import { CaretRight } from '@carbon/react/icons';
import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingList,
  FloatingNode,
  FloatingPortal,
  FloatingTree,
  offset,
  safePolygon,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFloatingNodeId,
  useFloatingParentNodeId,
  useFloatingTree,
  useHover,
  useInteractions,
  useListItem,
  useListNavigation,
  useMergeRefs,
  useRole,
  useTypeahead,
} from '@floating-ui/react';
import React, {
  useState,
  forwardRef,
  createContext,
  useRef,
  useContext,
  useEffect,
} from 'react';

const MenuContext = createContext({
  getItemProps: () => ({}),
  activeIndex: null,
  setActiveIndex: () => {},
  setHasFocusInside: () => {},
  isOpen: false,
});

export const FloatingMenu = React.forwardRef((props, ref) => {
  const parentId = useFloatingParentNodeId();

  if (parentId === null) {
    return (
      <FloatingTree>
        <MenuComponent {...props} ref={ref} />
      </FloatingTree>
    );
  }

  return <MenuComponent {...props} ref={ref} />;
});

if (__DEV__) {
  FloatingMenu.displayName = 'FloatingMenu';
}

export const MenuComponent = forwardRef(
  ({ children, label, ...props }, forwardedRef) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasFocusInside, setHasFocusInside] = useState(false);
    const [activeIndex, setActiveIndex] = useState(null);

    const elementsRef = useRef([]);
    const labelsRef = useRef([]);
    const parent = useContext(MenuContext);

    const tree = useFloatingTree();
    const nodeId = useFloatingNodeId();
    const parentId = useFloatingParentNodeId();
    const item = useListItem();

    const prefix = usePrefix();

    const isNested = parentId != null;

    const { floatingStyles, refs, context } = useFloating({
      nodeId,
      open: isOpen,
      onOpenChange: setIsOpen,
      placement: isNested ? 'right-start' : 'bottom-start',
      middleware: [
        offset({
          mainAxis: isNested ? 0 : 4,
          alignmentAxis: isNested ? -4 : 0,
        }),
        flip(),
        shift(),
      ],
      whileElementsMounted: autoUpdate,
    });

    const hover = useHover(context, {
      enabled: isNested,
      delay: { open: 75 },
      handleClose: safePolygon({ blockPointerEvents: true }),
    });
    const click = useClick(context, {
      event: 'mousedown',
      toggle: !isNested,
      ignoreMouse: isNested,
    });
    const role = useRole(context, { role: 'menu' });
    const dismiss = useDismiss(context, { bubbles: true });
    const listNavigation = useListNavigation(context, {
      listRef: elementsRef,
      activeIndex,
      nested: isNested,
      onNavigate: setActiveIndex,
    });
    const typeahead = useTypeahead(context, {
      listRef: labelsRef,
      onMatch: isOpen ? setActiveIndex : undefined,
      activeIndex,
    });

    const { getReferenceProps, getFloatingProps, getItemProps } =
      useInteractions([hover, click, role, dismiss, listNavigation, typeahead]);

    // Event emitter allows you to communicate across tree components.
    // This effect closes all menus when an item gets clicked anywhere
    // in the tree.
    useEffect(() => {
      if (!tree) {
        return;
      }

      function handleTreeClick() {
        setIsOpen(false);
      }

      function onSubMenuOpen(event) {
        if (event.nodeId !== nodeId && event.parentId === parentId) {
          setIsOpen(false);
        }
      }

      tree.events.on('click', handleTreeClick);
      tree.events.on('menuopen', onSubMenuOpen);

      return () => {
        tree.events.off('click', handleTreeClick);
        tree.events.off('menuopen', onSubMenuOpen);
      };
    }, [tree, nodeId, parentId]);

    useEffect(() => {
      if (isOpen && tree) {
        tree.events.emit('menuopen', { parentId, nodeId });
      }
    }, [tree, isOpen, nodeId, parentId]);

    useEffect(() => {
      const rootMenu = document.querySelector(
        `.${prefix}--floating-menu__root-menu`
      );
      const body = document.body;
      const rootMenuWidth = rootMenu.offsetWidth;
      body.style.setProperty('--custom-menu-width', `${rootMenuWidth}px`);
    }, [prefix]);

    const { className } = props;

    return (
      <FloatingNode id={nodeId}>
        <Button
          ref={useMergeRefs([refs.setReference, item.ref, forwardedRef])}
          tabIndex={
            !isNested ? undefined : parent.activeIndex === item.index ? 0 : -1
          }
          role={isNested ? 'menuitem' : undefined}
          data-open={isOpen ? '' : undefined}
          data-nested={isNested ? '' : undefined}
          data-focus-inside={hasFocusInside ? '' : undefined}
          className={cx(className, {
            [`${prefix}--floating-menu__item`]: isNested,
            [`${prefix}--floating-menu__root-menu`]: !isNested,
          })}
          {...getReferenceProps(
            parent.getItemProps({
              ...props,
              onFocus(event) {
                props.onFocus?.(event);
                setHasFocusInside(false);
                parent.setHasFocusInside(true);
              },
            })
          )}>
          {label}
          {isNested && <CaretRight />}
        </Button>
        <MenuContext.Provider
          value={{
            activeIndex,
            setActiveIndex,
            getItemProps,
            setHasFocusInside,
            isOpen,
          }}>
          <FloatingList elementsRef={elementsRef} labelsRef={labelsRef}>
            {isOpen && (
              <FloatingPortal>
                <FloatingFocusManager
                  context={context}
                  modal={false}
                  initialFocus={isNested ? -1 : 0}
                  returnFocus={!isNested}>
                  <div
                    ref={refs.setFloating}
                    className={`${prefix}--floating-menu__menu`}
                    // eslint-disable-next-line react/forbid-dom-props
                    style={floatingStyles}
                    {...getFloatingProps()}>
                    {children}
                  </div>
                </FloatingFocusManager>
              </FloatingPortal>
            )}
          </FloatingList>
        </MenuContext.Provider>
      </FloatingNode>
    );
  }
);

if (__DEV__) {
  MenuComponent.displayName = 'MenuComponent';
}

export const FloatingMenuItem = React.forwardRef(
  ({ label, disabled, ...props }, forwardedRef) => {
    const menu = React.useContext(MenuContext);
    const item = useListItem({ label: disabled ? null : label });
    const tree = useFloatingTree();
    const isActive = item.index === menu.activeIndex;
    const prefix = usePrefix();
    const { className } = props;

    return (
      <Button
        {...props}
        kind="ghost"
        ref={useMergeRefs([item.ref, forwardedRef])}
        type="button"
        role="menuitem"
        className={cx(`${prefix}--floating-menu__menu-item`, className)}
        tabIndex={isActive ? 0 : -1}
        disabled={disabled}
        {...menu.getItemProps({
          onClick(event) {
            props.onClick?.(event);
            tree?.events.emit('click');
          },
          onFocus(event) {
            props.onFocus?.(event);
            menu.setHasFocusInside(true);
          },
        })}>
        {label}
      </Button>
    );
  }
);

if (__DEV__) {
  FloatingMenuItem.displayName = 'MenuItem';
}

MenuComponent.propTypes = {
  /**
   * Specifies the contents of the floating menu
   */
  children: PropTypes.node,

  /**
   * Pass custom className
   */
  className: PropTypes.string,

  /**
   * Label for the trigger element
   */
  label: PropTypes.node,

  /**
   * onFocus callback
   */
  onFocus: PropTypes.func,
};

FloatingMenuItem.propTypes = {
  /**
   * Pass custom className
   */
  className: PropTypes.string,

  /**
   * Disabled state for menu item
   */
  disabled: PropTypes.bool,

  /**
   * Label for the menu item
   */
  label: PropTypes.node,

  /**
   * onClick callback
   */
  onClick: PropTypes.func,

  /**
   * onFocus callback
   */
  onFocus: PropTypes.func,
};
