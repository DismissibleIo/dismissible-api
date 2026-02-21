import { useConfigSection } from '../hooks/useWizardState';
import { ToggleInput, TextInput, NumberInput, SelectInput } from '../components/forms';
import { HELP_TEXT } from '../config/constants';

export function JwtAuthStep() {
  const { section: jwtAuth, update: updateJwtAuth, getError } = useConfigSection('jwtAuth');

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">JWT Authentication</h2>
      <p className="text-gray-400 mb-8">Secure your API with OIDC-compliant JWT authentication.</p>

      <ToggleInput
        label="Enable JWT Authentication"
        value={jwtAuth.enabled}
        onChange={(value) => updateJwtAuth({ enabled: value })}
        helpText={HELP_TEXT.jwtAuthEnabled}
        testId="jwt-enabled-toggle"
      />

      {jwtAuth.enabled && (
        <>
          <TextInput
            label="Well-Known URL"
            value={jwtAuth.wellKnownUrl || ''}
            onChange={(value) => updateJwtAuth({ wellKnownUrl: value })}
            helpText={HELP_TEXT.jwtAuthWellKnownUrl}
            placeholder="https://auth.example.com/.well-known/openid-configuration"
            type="url"
            required
            error={getError('wellKnownUrl')}
            testId="jwt-wellknown-url-input"
          />

          <TextInput
            label="Issuer"
            value={jwtAuth.issuer || ''}
            onChange={(value) => updateJwtAuth({ issuer: value })}
            helpText={HELP_TEXT.jwtAuthIssuer}
            placeholder="https://auth.example.com"
            error={getError('issuer')}
            testId="jwt-issuer-input"
          />

          <TextInput
            label="Audience"
            value={jwtAuth.audience || ''}
            onChange={(value) => updateJwtAuth({ audience: value })}
            helpText={HELP_TEXT.jwtAuthAudience}
            placeholder="api.example.com"
            error={getError('audience')}
            testId="jwt-audience-input"
          />

          <TextInput
            label="Algorithms"
            value={jwtAuth.algorithms}
            onChange={(value) => updateJwtAuth({ algorithms: value })}
            helpText={HELP_TEXT.jwtAuthAlgorithms}
            placeholder="RS256"
            required
            error={getError('algorithms')}
            testId="jwt-algorithms-input"
          />

          <NumberInput
            label="JWKS Cache Duration (ms)"
            value={jwtAuth.jwksCacheDuration}
            onChange={(value) => updateJwtAuth({ jwksCacheDuration: value })}
            helpText={HELP_TEXT.jwtAuthJwksCacheDuration}
            min={1}
            required
            error={getError('jwksCacheDuration')}
            testId="jwt-jwks-cache-duration-input"
          />

          <NumberInput
            label="Request Timeout (ms)"
            value={jwtAuth.requestTimeout}
            onChange={(value) => updateJwtAuth({ requestTimeout: value })}
            helpText={HELP_TEXT.jwtAuthRequestTimeout}
            min={1}
            required
            error={getError('requestTimeout')}
            testId="jwt-request-timeout-input"
          />

          <NumberInput
            label="Hook Priority"
            value={jwtAuth.priority}
            onChange={(value) => updateJwtAuth({ priority: value })}
            helpText={HELP_TEXT.jwtAuthPriority}
            required
            error={getError('priority')}
            testId="jwt-priority-input"
          />

          <ToggleInput
            label="Match User ID"
            value={jwtAuth.matchUserId}
            onChange={(value) => updateJwtAuth({ matchUserId: value })}
            helpText={HELP_TEXT.jwtAuthMatchUserId}
            testId="jwt-match-user-id-toggle"
          />

          {jwtAuth.matchUserId && (
            <>
              <TextInput
                label="User ID Claim"
                value={jwtAuth.userIdClaim}
                onChange={(value) => updateJwtAuth({ userIdClaim: value })}
                helpText={HELP_TEXT.jwtAuthUserIdClaim}
                placeholder="sub"
                required
                error={getError('userIdClaim')}
                testId="jwt-user-id-claim-input"
              />

              <SelectInput
                label="User ID Match Type"
                value={jwtAuth.userIdMatchType}
                onChange={(value) =>
                  updateJwtAuth({
                    userIdMatchType: value as 'exact' | 'substring' | 'regex',
                  })
                }
                options={[
                  { value: 'exact', label: 'Exact Match' },
                  { value: 'substring', label: 'Substring Match' },
                  { value: 'regex', label: 'Regex Match' },
                ]}
                helpText={HELP_TEXT.jwtAuthUserIdMatchType}
                required
                error={getError('userIdMatchType')}
                testId="jwt-user-id-match-type-select"
              />

              {jwtAuth.userIdMatchType === 'regex' && (
                <TextInput
                  label="User ID Match Regex"
                  value={jwtAuth.userIdMatchRegex || ''}
                  onChange={(value) => updateJwtAuth({ userIdMatchRegex: value })}
                  helpText={HELP_TEXT.jwtAuthUserIdMatchRegex}
                  placeholder="^(.+)@example\\.com$"
                  required
                  error={getError('userIdMatchRegex')}
                  testId="jwt-user-id-match-regex-input"
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
