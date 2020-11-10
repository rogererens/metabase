/* @flow */

import React, { Component } from "react";
import { connect } from "react-redux";

import Icon from "metabase/components/Icon";
import Popover from "metabase/components/Popover";
import { Link } from "react-router";

import MetabaseAnalytics from "metabase/lib/analytics";

import { performAction } from "metabase/visualizations/lib/action";

import type {
  ClickObject,
  ClickAction,
} from "metabase-types/types/Visualization";

import cx from "classnames";
import _ from "underscore";

const SECTIONS = {
  records: {
    icon: "table2",
  },
  zoom: {
    icon: "zoom_in",
  },
  details: {
    icon: "document",
  },
  sort: {
    icon: "sort",
  },
  breakout: {
    icon: "breakout",
  },
  filter: {
    icon: "funnel_outline",
  },
  summarize: {
    icon: "summarize",
  },
  sum: {
    icon: "sum",
  },
  averages: {
    icon: "curve",
  },
  dashboard: {
    icon: "dashboard",
  },
  auto: {
    icon: "bolt",
  },
  formatting: {
    icon: "pencil",
  },
};
// give them indexes so we can sort the sections by the above ordering (JS objects are ordered)
Object.values(SECTIONS).map((section, index) => {
  // $FlowFixMe
  section.index = index;
});

const getGALabelForAction = action =>
  action ? `${action.section || ""}:${action.name || ""}` : null;

type Props = {
  clicked: ?ClickObject,
  clickActions: ?(ClickAction[]),
  onChangeCardAndRun: Object => void,
  onClose: () => void,
};

type State = {
  popoverAction: ?ClickAction,
};

@connect()
export default class ChartClickActions extends Component {
  props: Props;
  state: State = {
    popoverAction: null,
  };

  close = () => {
    this.setState({ popoverAction: null });
    if (this.props.onClose) {
      this.props.onClose();
    }
  };

  handleClickAction = (action: ClickAction) => {
    // $FlowFixMe: dispatch provided by @connect
    const { dispatch, onChangeCardAndRun } = this.props;
    if (action.popover) {
      MetabaseAnalytics.trackEvent(
        "Actions",
        "Open Click Action Popover",
        getGALabelForAction(action),
      );
      this.setState({ popoverAction: action });
    } else {
      const didPerform = performAction(action, {
        dispatch,
        onChangeCardAndRun,
      });
      if (didPerform) {
        MetabaseAnalytics.trackEvent(
          "Actions",
          "Executed Click Action",
          getGALabelForAction(action),
        );
        this.close();
      } else {
        console.warn("No action performed", action);
      }
    }
  };

  render() {
    const { clicked, clickActions, onChangeCardAndRun } = this.props;

    if (!clicked || !clickActions || clickActions.length === 0) {
      return null;
    }

    const { popoverAction } = this.state;
    let popover;
    if (popoverAction && popoverAction.popover) {
      const PopoverContent = popoverAction.popover;
      popover = (
        <PopoverContent
          onChangeCardAndRun={({ nextCard }) => {
            if (popoverAction) {
              MetabaseAnalytics.trackEvent(
                "Action",
                "Executed Click Action",
                getGALabelForAction(popoverAction),
              );
            }
            onChangeCardAndRun({ nextCard });
          }}
          onClose={() => {
            MetabaseAnalytics.trackEvent(
              "Action",
              "Dismissed Click Action Menu",
              getGALabelForAction(popoverAction),
            );
            this.close();
          }}
        />
      );
    }

    const sections = _.chain(clickActions)
      .groupBy("section")
      .pairs()
      .sortBy(([key]) => (SECTIONS[key] ? SECTIONS[key].index : 99))
      .value();

    return (
      <Popover
        target={clicked.element}
        targetEvent={clicked.event}
        onClose={() => {
          MetabaseAnalytics.trackEvent("Action", "Dismissed Click Action Menu");
          this.close();
        }}
        verticalAttachments={["top", "bottom"]}
        horizontalAttachments={["left", "center", "right"]}
        sizeToFit
        pinInitialAttachment
      >
        {popover ? (
          popover
        ) : (
          <div className="text-bold px2 pt1 pb2">
            {sections.map(([key, actions]) => (
              <div className="py1">
                {SECTIONS[key].icon === "summarize" && (
                  <p className="text-bold text-medium text-small block">
                    Summarize
                  </p>
                )}
                {SECTIONS[key].icon === "breakout" && (
                  <p className="mt0 text-bold text-medium text-small block">
                    Break out by…
                  </p>
                )}
                {SECTIONS[key].icon === "bolt" && (
                  <p className="text-bold text-medium text-small block">
                    Automatic explorations
                  </p>
                )}
                <div
                  key={key}
                  className={cx(
                    "flex",
                    {
                      "border-top pt2 text-medium":
                        SECTIONS[key].icon === "pencil",
                    },
                    {
                      "align-center justify-center":
                        SECTIONS[key].icon === "pencil" ||
                        SECTIONS[key].icon === "sort",
                    },
                  )}
                >
                  {/*
                <Icon
                  name={(SECTIONS[key] && SECTIONS[key].icon) || "unknown"}
                  className="mr1 pl2 text-medium"
                  size={16}
                />
                */}
                  {actions.map((action, index) => (
                    <ChartClickAction
                      index={index}
                      action={action}
                      isLastItem={index === actions.length - 1}
                      handleClickAction={this.handleClickAction}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Popover>
    );
  }
}

export const ChartClickAction = ({
  action,
  isLastItem,
  handleClickAction,
}: {
  action: any,
  isLastItem: any,
  handleClickAction: any,
}) => {
  const className = cx("text-small cursor-pointer no-decoration", {
    "px2 text-brand-hover justify-evenly": action.buttonType === "text",
    "px3 py1 mr1 rounded text-brand-hover bg-light justify-between": action.buttonType === "sort",
    "p2 mr1 bg-purple-light rounded flex-full bg-purple-hover text-purple text-white-hover":
      action.buttonType === "horizontal",
      "p1 rounded flex-full bg-brand-hover text-brand text-white-hover":
        action.buttonType === "horizontal-no-outline",
    "bordered border-brand-light circular text-brand bg-brand-hover text-white-hover px2 py1 mr1":
      action.buttonType === "token",
    "flex-auto px3 pt2 pb2 mr1 bg-brand-light text-brand text-white-hover rounded bg-brand-hover":
      action.buttonType === "large",
  });
  // NOTE: Tom Robinson 4/16/2018: disabling <Link> for `question` click actions
  // for now since on dashboards currently they need to go through
  // navigateToNewCardFromDashboard to merge in parameters.,
  // Also need to sort out proper logic in QueryBuilder's componentWillReceiveProps
  // if (action.question) {
  //   return (
  //     <Link to={action.question().getUrl()} className={className}>
  //       {action.title}
  //     </Link>
  //   );
  // } else
  if (action.url) {
    return (
      <div>
        <Link
          to={action.url()}
          className={className}
          onClick={() =>
            MetabaseAnalytics.trackEvent(
              "Actions",
              "Executed Click Action",
              getGALabelForAction(action),
            )
          }
        >
          {action.title}
        </Link>
      </div>
    );
  } else {
    return (
      <div
        className={cx(
          className,
          {
            "flex flex-column align-center": action.buttonType === "large",
          },
          {
            "flex flex-row justify-left":
              action.buttonType === "text" ||
              action.buttonType === "horizontal",
          },
        )}
        onClick={() => handleClickAction(action)}
      >
        {action.icon && (
          <Icon
            className={cx(
              "flex",
              {
                mr1: action.buttonType !== "large",
              },
              { mb1: action.buttonType === "large" },
            )}
            size={action.buttonType === "large" ? 20 : action.buttonType === "horizontal" ? 16 : 12}
            name={action.icon}
          />
        )}
        {action.title}
      </div>
    );
  }
};
