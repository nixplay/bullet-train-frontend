import React, { Component } from 'react';
import EditIdentityModal from './UserPage';
import CreateFlagModal from '../modals/CreateFlag';
import ConfirmToggleFeature from '../modals/ConfirmToggleFeature';
import TryIt from '../TryIt';
import ConfirmRemoveFeature from '../modals/ConfirmRemoveFeature';

const FeaturesPage = class extends Component {
    static displayName = 'FeaturesPage';

    static contextTypes = {
        router: propTypes.object.isRequired,
    };

    constructor(props, context) {
        super(props, context);
        this.state = {};
        AppActions.getFeatures(this.props.match.params.projectId, this.props.match.params.environmentId);
    }

    componentWillUpdate(newProps) {
        const { match: { params } } = newProps;
        const { match: { params: oldParams } } = this.props;
        if (params.environmentId != oldParams.environmentId || params.projectId != oldParams.projectId) {
            AppActions.getFeatures(params.projectId, params.environmentId);
        }
    }

    componentDidMount = () => {
        API.trackPage(Constants.pages.FEATURES);
        const { match: { params } } = this.props;
        AsyncStorage.setItem('lastEnv', JSON.stringify({
            orgId: AccountStore.getOrganisation().id,
            projectId: params.projectId,
            environmentId: params.environmentId,
        }));
    };

    newFlag = () => {
        openModal('New Feature', <CreateFlagModal
          router={this.context.router}
          environmentId={this.props.match.params.environmentId}
          projectId={this.props.match.params.projectId}
        />, null, { className: 'alert fade expand' });
    };


    editFlag = (projectFlag, environmentFlag) => {
        API.trackEvent(Constants.events.VIEW_FEATURE);
        openModal('Edit Feature', <CreateFlagModal
          isEdit
          router={this.context.router}
          environmentId={this.props.match.params.environmentId}
          projectId={this.props.match.params.projectId}
          projectFlag={projectFlag}
          environmentFlag={environmentFlag}
          flagId={environmentFlag.id}
        />, null, { className: 'side-modal fade' });
    };


    componentWillReceiveProps(newProps) {
        if (newProps.match.params.environmentId != this.props.match.params.environmentId) {
            AppActions.getFeatures(newProps.match.params.projectId, newProps.match.params.environmentId);
        }
    }

    onSave = () => {
        toast('Environment Saved');
    };

    editIdentity = (id, envFlags) => {
        openModal(<EditIdentityModal id={id} envFlags={envFlags}/>);
    }

    confirmToggle = (projectFlag, environmentFlag, cb) => {
        openModal('Toggle Feature', <ConfirmToggleFeature
          environmentId={this.props.match.params.environmentId}
          projectFlag={projectFlag} environmentFlag={environmentFlag}
          cb={cb}
        />);
    }

    confirmRemove = (projectFlag, cb) => {
        openModal('Remove Feature', <ConfirmRemoveFeature
          environmentId={this.props.match.params.environmentId}
          projectFlag={projectFlag}
          cb={cb}
        />);
    }

    createFeaturePermission(el) {
        return (
            <Permission level="project" permission="CREATE_FEATURE" id={this.props.match.params.projectId}>
                {({ permission, isLoading }) => (permission ? (
                    el(permission)
                ) : this.renderWithPermission(permission, Constants.projectPermissions('Create Feature'), el(permission)))}
            </Permission>
        );
    }

    renderWithPermission(permission, name, el) {
        return permission ? (
            el
        ) : (
            <Tooltip
              title={el}
              place="right"
              html
            >
                {name}
            </Tooltip>
        );
    }

    onError = (error) => {
        // Kick user back out to projects
        this.setState({ error });
        if (typeof closeModal !== 'undefined') {
            closeModal();
            toast('We could not create this feature, please check the name is not in use.');
        }
    }

    render() {
        const { projectId, environmentId } = this.props.match.params;
        return (
            <div data-test="features-page" id="features-page" className="app-container container">
                <FeatureListProvider onSave={this.onSave} onError={this.onError}>
                    {({ isLoading, projectFlags, environmentFlags }, { environmentHasFlag, toggleFlag, editFlag, removeFlag }) => (
                        <div className="features-page">
                            {isLoading && <div className="centered-container"><Loader/></div>}
                            {!isLoading && (
                                <div>
                                    {projectFlags && projectFlags.length ? (
                                        <div>
                                            <Row>
                                                <Flex>
                                                    <h3>Features</h3>
                                                    <p>
                                                        View and manage
                                                        {' '}
                                                        <Tooltip
                                                          title={<ButtonLink buttonText={'feature flags'} />}
                                                          place="right"
                                                        >
                                                            {Constants.strings.FEATURE_FLAG_DESCRIPTION}
                                                        </Tooltip>
                                                        {' '}
                                                        and
                                                        {' '}
                                                        {' '}
                                                        <Tooltip
                                                          title={<ButtonLink buttonText={'remote config'} />}
                                                          place="right"
                                                        >
                                                            {Constants.strings.REMOTE_CONFIG_DESCRIPTION}
                                                        </Tooltip>
                                                        {' '}
                                                        for
                                                        your selected environment.
                                                    </p>
                                                </Flex>
                                                <FormGroup className="float-right">
                                                    {projectFlags && projectFlags.length ? this.createFeaturePermission(perm => (
                                                        <div className="text-right">
                                                            <Button
                                                              disabled={!perm} data-test="show-create-feature-btn" id="show-create-feature-btn"
                                                              onClick={this.newFlag}
                                                            >
                                                              Create Feature
                                                            </Button>
                                                        </div>
                                                    ))
                                                        : null}
                                                </FormGroup>
                                            </Row>
                                            <Permission level="environment" permission="ADMIN" id={this.props.match.params.environmentId}>
                                                {({ permission, isLoading }) => (
                                                    <FormGroup className="mb-4">
                                                        <PanelSearch
                                                          className="no-pad"
                                                          id="features-list"
                                                          icon="ion-ios-rocket"
                                                          title="Features"
                                                          items={projectFlags}
                                                          renderRow={(projectFlag, i) => {
                                                              const { name, id, enabled, created_date, type } = projectFlag;
                                                              return (
                                                                  <Row
                                                                    className={permission ? 'list-item clickable' : 'list-item'} key={id} space
                                                                    data-test={`feature-item-${i}`}
                                                                  >
                                                                      <div
                                                                        className="flex flex-1"
                                                                        onClick={() => permission && this.editFlag(projectFlag, environmentFlags[id])}
                                                                      >
                                                                          <Row>
                                                                              <ButtonLink>
                                                                                  {name}
                                                                              </ButtonLink>
                                                                              <Column/>
                                                                          </Row>
                                                                          <div className="list-item-footer faint">
                                                                          Created
                                                                              {' '}
                                                                              {moment(created_date).format('DD/MMM/YYYY')}
                                                                          </div>
                                                                      </div>
                                                                      <Row>
                                                                          {
                                                                              this.renderWithPermission(permission, Constants.environmentPermissions('Admin'), (


                                                                                  <Column>
                                                                                      {type === 'FLAG' ? (
                                                                                          <Switch
                                                                                            disabled={!permission}
                                                                                            data-test={`feature-switch-${i}${environmentFlags[id] && environmentFlags[id].enabled ? '-on' : '-off'}`}
                                                                                            checked={environmentFlags[id] && environmentFlags[id].enabled}
                                                                                            onChange={() => this.confirmToggle(projectFlag, environmentFlags[id], (environments) => {
                                                                                                toggleFlag(_.findIndex(projectFlags, { id }), environments);
                                                                                            })}
                                                                                          />
                                                                                      ) : (
                                                                                          <FeatureValue
                                                                                            onClick={() => permission && this.editFlag(projectFlag, environmentFlags[id])}
                                                                                            value={environmentFlags[id] && environmentFlags[id].feature_state_value}
                                                                                            data-test={`feature-value-${i}`}
                                                                                          />
                                                                                      )}
                                                                                  </Column>
                                                                              ))
                                                                            }
                                                                          <Permission level="project" permission="DELETE_FEATURE" id={this.props.match.params.projectId}>
                                                                              {({ permission: removeFeaturePermission }) => this.renderWithPermission(removeFeaturePermission, Constants.projectPermissions('Delete Feature'), (
                                                                                  <Column>
                                                                                      <button
                                                                                        disabled={!removeFeaturePermission}
                                                                                        id="remove-feature"
                                                                                        onClick={() => this.confirmRemove(projectFlag, () => {
                                                                                            removeFlag(this.props.match.params.projectId, projectFlag);
                                                                                        })}
                                                                                        className="btn btn--with-icon"
                                                                                        data-test={`remove-feature-btn-${i}`}
                                                                                      >
                                                                                          <RemoveIcon/>
                                                                                      </button>
                                                                                  </Column>
                                                                              ))}
                                                                          </Permission>
                                                                      </Row>
                                                                  </Row>
                                                              );
                                                          }}
                                                          renderNoResults={(
                                                              <div className="text-center">
                                                                  {/* <FormGroup> */}
                                                                  {/* <button onClick={this.newFlag} */}
                                                                  {/* className={"btn btn-primary btn-lg"} */}
                                                                  {/* id="showCreateFeatureBtn"> */}
                                                                  {/* <span className="icon ion-ios-rocket"/> */}
                                                                  {/* Create your first feature */}
                                                                  {/* </button> */}
                                                                  {/* </FormGroup> */}
                                                              </div>
                                                        )}
                                                          filterRow={({ name }, search) => name.toLowerCase().indexOf(search) > -1}
                                                        />
                                                    </FormGroup>
                                                )}

                                            </Permission>
                                            <FormGroup>
                                                <CodeHelp
                                                  title="1: Installing the SDK"
                                                  snippets={Constants.codeHelp.INSTALL}
                                                />
                                                <CodeHelp
                                                  title="2: Initialising your project"
                                                  snippets={Constants.codeHelp.INIT(this.props.match.params.environmentId, projectFlags && projectFlags[0] && projectFlags[0].name)}
                                                />
                                            </FormGroup>
                                            <FormGroup>
                                                <TryIt
                                                  title="Test what values are being returned from the API on this environment"
                                                  environmentId={this.props.match.params.environmentId}
                                                />
                                            </FormGroup>
                                        </div>
                                    ) : (
                                        <div>
                                            <h3>Brilliant! Now create your features.</h3>

                                            <FormGroup>
                                                <Panel icon="ion-ios-rocket" title="1. creating a feature">
                                                    <p>
                                                        You can create two types of features for your project:
                                                        <ul>
                                                            <li>
                                                                <strong>Feature Flags</strong>
                                                                : These allows you to
                                                                toggle
                                                                features on and off:
                                                                <p className="faint">
                                                                    EXAMPLE: You're working on a new messaging feature
                                                                    for
                                                                    your app but only show it on develop.
                                                                </p>
                                                            </li>
                                                            <li>
                                                                <strong>Remote configuration</strong>
                                                                : configuration for
                                                                a
                                                                particular feature
                                                                <p className="faint">
                                                                    EXAMPLE: This could be absolutely anything from a
                                                                    font size for a website/mobile app or an environment
                                                                    variable
                                                                    for a server
                                                                </p>
                                                            </li>
                                                        </ul>
                                                    </p>
                                                </Panel>
                                            </FormGroup>
                                            <FormGroup>
                                                <Panel
                                                  icon="ion-ios-settings"
                                                  title="2. configuring features per environment"
                                                >
                                                    <p>
                                                        We've created 2 environments for
                                                        you
                                                        {' '}
                                                        <strong>Development</strong>
                                                        {' '}
                                                        and
                                                        {' '}
                                                        <strong>Production</strong>
                                                        .
                                                        When
                                                        you create a feature it makes copies of them for each
                                                        environment,
                                                        allowing you to edit the values separately. You can create more
                                                        environments too if you need to.
                                                    </p>
                                                </Panel>
                                            </FormGroup>

                                            <FormGroup>
                                                <Panel
                                                  icon="ion-ios-person"
                                                  title="3. configuring features per user"
                                                >
                                                    <p>
                                                        When users login to your application, you
                                                        can
                                                        {' '}
                                                        <strong>identify</strong>
                                                        {' '}
                                                        them using one of our SDKs, this
                                                        will add
                                                        them to the users page.
                                                        From there you can configure their features. We've created an
                                                        example user for you which you can see in the
                                                        {' '}
                                                        <Link
                                                          to={`/project/${projectId}/environment/${environmentId}/users`}
                                                        >
                                                            Users
                                                            page
                                                        </Link>
                                                        <p className="faint">
                                                            EXAMPLE: You're working on a new messaging feature for your
                                                            app but
                                                            only show it for that user.
                                                        </p>
                                                    </p>
                                                </Panel>
                                            </FormGroup>
                                            {this.createFeaturePermission(perm => (
                                                <FormGroup className="text-center">
                                                    <Button
                                                      disabled={!perm}
                                                      className="btn-lg btn-primary" id="show-create-feature-btn" data-test="show-create-feature-btn"
                                                      onClick={this.newFlag}
                                                    >
                                                        <span className="icon ion-ios-rocket"/>
                                                        {' '}
                                                      Create your first Feature
                                                    </Button>
                                                </FormGroup>
                                            ))}
                                        </div>
                                    )}

                                </div>
                            )}
                        </div>
                    )}
                </FeatureListProvider>
            </div>
        );
    }
};

FeaturesPage.propTypes = {};

module.exports = hot(module)(FeaturesPage);
